import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { problemInputSchema, type ProblemInput } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Upload, Trash2 } from "lucide-react";
import axios from 'axios';


export default function ProblemInput() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [problemText, setProblemText] = useState("");
  const [imageData, setImageData] = useState<string | undefined>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      if (problemText.trim()) {
        formData.append("problemText", problemText.trim());
      }

      if (imageData) {
        try {
          const response = await axios.get(imageData, { responseType: 'blob' });
          formData.append("image", response.data);
        } catch (error) {
          console.error("Error processing image:", error);
          throw new Error("Failed to process image");
        }
      }
      
      const response = await axios({
        method: 'post',
        url: '/api/analyze',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Create the state object
      const stateData = {
        template: response.data.template,
        blueprint: response.data.blueprint,
        topic: response.data.topic,
        gradeLevel: response.data.gradeLevel,
        problemText: response.data.problemText,
        imageUrl: response.data.imageUrl
      };

      // Use URLSearchParams to properly construct the URL
      const params = new URLSearchParams();
      params.append('state', JSON.stringify(stateData));
      
      // Navigate with properly constructed URL
      setLocation(`/template/new?${params.toString()}`);

    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: axios.isAxiosError(error) 
          ? `API Error: ${error.response?.data?.error || error.message}`
          : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImageData(imageData);
        setImagePreview(imageData);
        setProblemText(""); // Clear problem text when image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const imageData = reader.result as string;
            setImageData(imageData);
            setImagePreview(imageData);
            setProblemText(""); // Clear problem text when image is pasted
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste as unknown as EventListener);
    return () => {
      document.removeEventListener("paste", handlePaste as unknown as EventListener);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Problem Text</label>
          <Textarea
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Type or paste your math problem here..."
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Problem Image (Optional) - Paste an image or upload a file
          </label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2"
          />
        </div>

        {imagePreview && (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full max-h-60 border rounded-lg" 
            />
            <Button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setImageData(undefined);
              }}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={!problemText && !imageData}
        >
          <Upload className="h-4 w-4 mr-2" />
          Analyze Problem
        </Button>
      </div>
    </form>
  );
}
