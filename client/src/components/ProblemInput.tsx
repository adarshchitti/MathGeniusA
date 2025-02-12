import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { problemInputSchema, type ProblemInput } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Upload } from "lucide-react";

export default function ProblemInput() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ProblemInput>({
    resolver: zodResolver(problemInputSchema),
    defaultValues: {
      problemText: "",
      imageData: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProblemInput) => {
      const formData = new FormData();
      formData.append("problemText", data.problemText);
      
      if (data.imageData) {
        const response = await fetch(data.imageData);
        const blob = await response.blob();
        formData.append("image", blob);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to analyze problem");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/template/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze the problem. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("imageData", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <FormField
          control={form.control}
          name="problemText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Text</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Type or paste your math problem here..."
                  rows={4}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="mt-6">
          <FormLabel>Problem Image (Optional)</FormLabel>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2"
          />
        </div>

        <Button 
          type="submit" 
          className="mt-6 w-full"
          disabled={mutation.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          Analyze Problem
        </Button>
      </form>
    </Form>
  );
}
