import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema, type FeedbackInput } from "@shared/schema";
import Rating from "@/components/Rating";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Save, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import axios from "axios";

type Problem = {
  problemText: string;
  template: string;
  topic: string;
  gradeLevel: string;
  imageUrl?: string | null;
  rating?: number | null;
  feedback?: string | null;
};

export default function Template() {
  const { id } = useParams();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<{
    question: string;
    solution: string;
  } | null>(null);
  
  // Get the search string from the URL
  const searchString = window.location.search;
  console.log("Search string:", searchString);
  
  let state = {};
  
  if (searchString) {
    try {
      const params = new URLSearchParams(searchString);
      const stateParam = params.get('state');
      
      if (stateParam) {
        state = JSON.parse(stateParam);
        console.log("Parsed state:", state);
      }
    } catch (error) {
      console.error("Error parsing state:", error);
    }
  }

  const { data: problem, isLoading } = useQuery<Problem>({
    queryKey: [`/api/problems/${id}`],
    enabled: Boolean(id),
    queryFn: async (): Promise<Problem> => {
      const response = await apiRequest("GET", `/api/problems/${id}`);
      return response.json();
    }
  });

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      template: "",
      rating: 0,
      feedback: "",
    },
  });

  // Ensure the form updates with backend data when problem loads
  useEffect(() => {
    if (problem && !isLoading) {
      form.reset({
        template: problem.template ?? "",
        rating: problem.rating ?? 0,
        feedback: problem.feedback ?? "",
      });
    }
  }, [problem, isLoading, form]);

  const mutation = useMutation({
    mutationFn: async (data: FeedbackInput) => {
      await apiRequest("POST", `/api/problems/${id}/feedback`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/problems/${id}`] });
      toast({
        title: "Success",
        description: "Your feedback has been saved",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      template: data.template,
      rating: data.rating,
      feedback: data.feedback,
    });
  });

  const generateSimilarQuestion = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post("/api/generate", {
        template: state.template,
        blueprint: state.blueprint,
      });

      setGeneratedQuestion(response.data);
    } catch (error) {
      console.error("Error generating question:", error);
      toast({
        title: "Error",
        description: "Failed to generate similar question",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="h-96" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Problem Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Original Problem */}
            <div>
              <label className="block text-sm font-medium mb-2">Original Problem</label>
              <Textarea 
                className="mt-2"
                value={state.problemText || ''}
                readOnly
                rows={4}
              />
            </div>

            {/* Solution Template */}
            <div>
              <label className="block text-sm font-medium mb-2">Solution Template</label>
              <Textarea 
                className="font-mono mt-2"
                value={state.template || ''}
                readOnly
                rows={4}
              />
            </div>

            {/* Blueprint */}
            <div>
              <label className="block text-sm font-medium mb-2">Problem Blueprint</label>
              <Textarea 
                className="font-mono mt-2"
                value={state.blueprint || ''}
                readOnly
                rows={6}
              />
            </div>

            {/* Grade & Topic */}
            <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
              <div>
                <span className="font-semibold">Grade Level: </span>
                <span>{state.gradeLevel || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold">Topic: </span>
                <span>{state.topic || 'N/A'}</span>
              </div>
            </div>

            {/* Original Image */}
            {state.imageUrl && (
              <div>
                <label className="block text-sm font-medium mb-2">Original Image</label>
                <img 
                  src={state.imageUrl} 
                  alt="Problem" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Similar Question Button */}
        <Button
          className="w-full"
          onClick={generateSimilarQuestion}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Similar Question"
          )}
        </Button>

        {/* Generated Question Card */}
        {generatedQuestion && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Similar Problem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generated Question */}
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <Textarea
                  className="mt-2"
                  value={generatedQuestion.question}
                  readOnly
                  rows={4}
                />
              </div>

              {/* Solution */}
              <div>
                <label className="block text-sm font-medium mb-2">Solution</label>
                <Textarea
                  className="mt-2 font-mono"
                  value={generatedQuestion.solution}
                  readOnly
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

