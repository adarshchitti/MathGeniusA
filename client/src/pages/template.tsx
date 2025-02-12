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
import { Pencil, Save } from "lucide-react";

export default function Template() {
  const { id } = useParams();
  const { toast } = useToast();
  
  const { data: problem, isLoading } = useQuery({
    queryKey: [`/api/problems/${id}`],
  });

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      template: problem?.template ?? "",
      rating: problem?.rating,
      feedback: problem?.feedback,
    },
  });

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
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Generated Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solution Template</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="font-mono"
                          rows={10}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate this template</FormLabel>
                        <FormControl>
                          <Rating 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Additional Feedback</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Any other comments about the template?"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit"
                  className="mt-6"
                  disabled={mutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Feedback
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <span className="font-semibold">Topic:</span> {problem.topic}
          </div>
          <div>
            <span className="font-semibold">Grade Level:</span> {problem.gradeLevel}
          </div>
          {problem.imageUrl && (
            <div>
              <span className="font-semibold">Original Image:</span>
              <img 
                src={problem.imageUrl} 
                alt="Math problem"
                className="mt-2 max-w-full rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
