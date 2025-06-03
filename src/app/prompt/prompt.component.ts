import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prompt',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.css']
})
export class PromptComponent {
  promptText = '';
  responseText: string = '';
  questionText = signal('');
  paragraphText = signal('');
  tableData = signal<any[]>([]);
  file: File | null = null;
  SpeechToText() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      this.paragraphText.set("Listening...");
    };
    recognition.onresult = (event: any) => {
      if (event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        this.questionText.set(transcript);
        console.log("Recognized speech:", transcript);
      } else {
        console.warn("No speech detected.");
      }
      recognition.stop();
    };
    recognition.onerror = (event: any) => {
      console.error("Error occurred in recognition:", event.error);
    };
    recognition.onend = () => {
      this.paragraphText.set("Speech stopped.");
    };
    recognition.start();
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) 
    {
      this.file = input.files[0];
    }
  }
  async askQuestion() 
  {
    let list;
    try 
    {
      const response = await fetch('http://localhost:3000');
      const data = await response.json();
      this.tableData.set(data);
      list = data;
    } 
    catch (error) 
    {
      console.error("Error fetching data:", error);
    }
    const fullPrompt = JSON.stringify(list) + " " + this.promptText + " " + this.questionText();
    const sendPrompt = async (prompt: string,fileContent: string | ArrayBuffer | null,filetype: string | null) => 
    {
      try 
      {
        const response = await fetch('http://localhost:3000', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, fileContent, filetype })
        });
        const data = await response.json();
        if (typeof data.text === 'string') 
        {
          this.responseText = data.text;
          try 
          {
            const result = JSON.parse(this.responseText);
            if (result.tool === "AddToCart") {
              this.AddToCart(result.items);
            }
            else if (result.tool === "RemoveFromCart") 
            {
              this.RemoveFromCart(result.items);
            }
          } 
          catch (error) 
          {
            console.warn("Response is not valid JSON:");
          }
        } 
        else 
        {
          this.responseText = "Unexpected response format from backend.";
        }
      } 
      catch (error) 
      {
        console.error("Error sending prompt:", error);
        this.responseText = "Failed to send prompt.";
      }
    };
    if (this.file) 
    {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const fileContent = fileReader.result;
        const filetype = this.file!.type;
        sendPrompt(fullPrompt, fileContent, filetype);
      };
      fileReader.readAsDataURL(this.file);
    } 
    else 
    {
      sendPrompt(fullPrompt, null, null);
    }
  }
  async AddToCart(items: any[]) 
  {
    try
    {
        const res = await fetch('http://localhost:3000/AddToCart', 
        {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({items})
        });
        const data=await res.json();
        console.log(data);
    } 
    catch(error) 
    {
        console.log("Error adding to cart:", error);
    }
  }
  async RemoveFromCart(items: any[]) 
  {
    try
    {
        const res = await fetch('http://localhost:3000/RemoveFromCart', 
        {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({items})
        });
        const data=await res.json();
        console.log(data);
    } 
    catch(error) 
    {
        console.log("Error adding to cart:", error);
    }
  }
}
