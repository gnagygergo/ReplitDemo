import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type DevPattern,
  type InsertDevPattern,
  insertDevPatternSchema,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Edit, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import DOMPurify from 'dompurify';

interface DevPatternDetailProps {
  devPattern: DevPattern;
}

export default function DevPatternDetail({ devPattern }: DevPatternDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<InsertDevPattern>({
    resolver: zodResolver(insertDevPatternSchema),
    defaultValues: {
      name: "",
      description: "",
      pattern: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertDevPattern) => {
      return apiRequest("PATCH", `/api/dev-patterns/${devPattern.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev-patterns"] });
      toast({
        title: "Dev pattern updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update dev pattern",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDevPattern) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (devPattern) {
      form.reset({
        name: devPattern.name,
        description: devPattern.description || "",
        pattern: devPattern.pattern || "",
      });
    }
  };

  useEffect(() => {
    if (devPattern) {
      form.reset({
        name: devPattern.name,
        description: devPattern.description || "",
        pattern: devPattern.pattern || "",
      });
    }
  }, [devPattern, form]);

  const sanitizedPattern = useMemo(() => {
    return DOMPurify.sanitize(devPattern.pattern || "<p>No pattern provided</p>");
  }, [devPattern.pattern]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dev Pattern Detail View</CardTitle>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel-edit-dev-pattern"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-edit-dev-pattern"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-dev-pattern"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter pattern name"
                        data-testid="input-edit-dev-pattern-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={3}
                        placeholder="Enter pattern description"
                        className="resize-none"
                        data-testid="input-edit-dev-pattern-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern (Rich Text)</FormLabel>
                    <FormControl>
                      <TiptapEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter pattern details with formatting..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <div
                className="mt-1 text-foreground"
                data-testid="text-dev-pattern-name-value"
              >
                {devPattern.name}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <div
                className="mt-1 text-foreground whitespace-pre-wrap"
                data-testid="text-dev-pattern-description-value"
              >
                {devPattern.description || "No description provided"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Pattern
              </label>
              <div
                className="mt-1 prose prose-sm max-w-none"
                data-testid="text-dev-pattern-pattern-value"
                dangerouslySetInnerHTML={{ __html: sanitizedPattern }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
