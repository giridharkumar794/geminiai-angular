const express = require('express');
require('dotenv').config();
const cors = require('cors');
const sql = require('mssql');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const config = {
    server: 'localhost\\SQLEXPRESS', 
    database: 'ProductDb',
    user: 'sa', 
    password: '12345678', 
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

const ai = new GoogleGenerativeAI(process.env.apikey);
const model = ai.getGenerativeModel({model: "gemini-1.5-flash"});
async function getproducts()
{
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT PId, PName, Price, Quantity FROM ProductApis');
		await sql.close();
		return result.recordset;
	} catch (error) {
		throw new Error('Product metadata fetch failed');
	}
}
app.post('/', async (req, res) => {
    try {
        const { prompt, fileContent, filetype } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }
		const productsprompt= JSON.stringify(await getproducts()) + "" + prompt;
        const fullprompt = [{ text: productsprompt }];

        if (fileContent && filetype) {
            const base64Data = fileContent.includes(',') 
                ? fileContent.split(',')[1] 
                : fileContent;
            
            fullprompt.push({
                inlineData: {
                    mimeType: filetype,
                    data: base64Data
                }
            });
        }
        const result = await model.generateContent(fullprompt);     
        const response = await result.response;
        const text = response.text();   
        res.json({ text });
    } 
    catch (err) 
    {
        res.status(500).json("Failed to process request");
    }
});

app.post('/productswithimage', async (req, res) => {
	const { ids } = req.body; 
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No product IDs provided" });
    }
    try {
        await sql.connect(config);
        const idList = ids.join(',');
        const result = await sql.query(`
            SELECT * FROM ProductApis WHERE PId IN (${idList})
        `);

        const products = result.recordset.map(item => {
            let base64Image = null;
            if (item.Image) {
                base64Image = `data:image/jpg;base64,${Buffer.from(item.Image).toString('base64')}`;
            }
            return {
                PId: item.PId,
                PName: item.PName,
                Price: item.Price,
                Quantity: item.Quantity,
                Image: base64Image
            };
        });

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Product lookup failed" });
    } finally {
        await sql.close();
    }
});
app.get('/GetCart', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT * FROM Cart');

		const cartItems = result.recordset.map(item => {
			let base64Image = null;

			if (item.Image) {
				base64Image = `data:image/jpeg;base64,${Buffer.from(item.Image).toString('base64')}`;
			}

			return {
				PId: item.PId,
				PName: item.PName,
				Price: item.Price,
				Quantity: item.Quantity,
				Image: base64Image 
			};
		});

		res.json(cartItems);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Cart query failed' });
	} finally {
		await sql.close();
	}
});

app.post('/AddToCart', async (req, res) => {
    try {
        const { items } = req.body;
        await sql.connect(config);

        for (const item of items) {
            const { PId, PName, Price, Quantity } = item;
            const imageResult = await sql.query`
                SELECT Image FROM ProductApis WHERE PId = ${PId}`;

            let imageBuffer = null;
            if (imageResult.recordset.length > 0) {
                imageBuffer = imageResult.recordset[0].Image;
            }

            const request = new sql.Request();
            request.input('PId', sql.Int, PId);
            request.input('PName', sql.VarChar, PName);
            request.input('Price', sql.Decimal(18, 2), Price);
            request.input('Quantity', sql.Int, Quantity);
            request.input('Image', sql.Image, imageBuffer);

            await request.query(`
                INSERT INTO Cart (PId, PName, Price, Quantity, Image)
                VALUES (@PId, @PName, @Price, @Quantity, @Image)
            `);
        }

        res.json('All Products added successfully');
    } catch (error) {
        console.error('AddToCart error:', error);
        res.status(500).json('Cart was not updated successfully');
    } finally {
        await sql.close();
    }
});

app.post('/RemoveFromCart', async (req, res) => {
	try{
		 const { items } = req.body;
    		 await sql.connect(config);
		 for(var item of items)
		 {
			const { PId, PName, Price, Quantity } = item;
			const request = new sql.Request();
		 	request.input('PId', sql.Int, PId);
  	        	await request.query(`
	         		DELETE FROM Cart WHERE PId=@PId
   		        `);
		 }
		 res.json('All Products removed successfully');
	}
	catch(error)
	{
		res.status(500).json('cart is not removed successfully');
	}
	finally{
		await sql.close();
	}
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
