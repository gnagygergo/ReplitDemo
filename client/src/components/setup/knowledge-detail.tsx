import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { KnowledgeArticleWithAuthor, User, Language } from "@shared/schema";
import { insertKnowledgeArticleSchema } from "@shared/schema";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

type KnowledgeArticleForm = z.infer<typeof insertKnowledgeArticleSchema>;

export default function KnowledgeArticleDetail() {
  const [, params] = useRoute("/setup/knowledge-articles/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUserLookupOpen, setIsUserLookupOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<User | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const articleId = params?.id;
  const isNewArticle = articleId === "new";

  // Fetch languages for the language selector
  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  // Fetch current user to set as default author for new articles
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch article data if editing
  const { data: article, isLoading } = useQuery<KnowledgeArticleWithAuthor>({
    queryKey: ["/api/knowledge-articles", articleId],
    enabled: !isNewArticle && !!articleId,
  });

  const form = useForm<KnowledgeArticleForm>({
    resolver: zodResolver(insertKnowledgeArticleSchema),
    defaultValues: {
      articleTitle: "",
      languageCode: "",
      articleFunctionalDomain: "",
      articleFunctionalityName: "",
      articleTags: "",
      articleKeywords: "",
      articleContent: "",
      authorId: "",
    },
  });

  // Set form values when article data is loaded or current user is available
  useEffect(() => {
    if (article) {
      form.reset({
        articleTitle: article.articleTitle || "",
        languageCode: article.languageCode || "",
        articleFunctionalDomain: article.articleFunctionalDomain || "",
        articleFunctionalityName: article.articleFunctionalityName || "",
        articleTags: article.articleTags || "",
        articleKeywords: article.articleKeywords || "",
        articleContent: article.articleContent || "",
        authorId: article.authorId || "",
      });
      setEditorContent(article.articleContent || "");
      if (article.author) {
        setSelectedAuthor(article.author);
      }
    } else if (isNewArticle && currentUser) {
      form.setValue("authorId", currentUser.id);
      setSelectedAuthor(currentUser);
    }
  }, [article, currentUser, isNewArticle, form]);

  const createArticleMutation = useMutation({
    mutationFn: async (data: KnowledgeArticleForm) => {
      return await apiRequest("POST", "/api/knowledge-articles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles"] });
      toast({
        title: "Success",
        description: "Knowledge article created successfully",
      });
      setLocation("/setup/knowledge-articles");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create knowledge article",
      });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: KnowledgeArticleForm) => {
      return await apiRequest("PATCH", `/api/knowledge-articles/${articleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles", articleId] });
      toast({
        title: "Success",
        description: "Knowledge article updated successfully",
      });
      setLocation("/setup/knowledge-articles");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update knowledge article",
      });
    },
  });

  const onSubmit = (data: KnowledgeArticleForm) => {
    // Update article content from editor
    const formData = {
      ...data,
      articleContent: editorContent,
    };

    if (isNewArticle) {
      createArticleMutation.mutate(formData);
    } else {
      updateArticleMutation.mutate(formData);
    }
  };

  const handleAuthorSelect = (user: User) => {
    setSelectedAuthor(user);
    form.setValue("authorId", user.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/setup/knowledge-articles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Loading...</h3>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading article...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/setup/knowledge-articles")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">
              {isNewArticle ? "Create Knowledge Article" : "Edit Knowledge Article"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isNewArticle
                ? "Create a new knowledge base article"
                : "Update article details and content"}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
          data-testid="button-save-article"
        >
          <Save className="mr-2 h-4 w-4" />
          {createArticleMutation.isPending || updateArticleMutation.isPending
            ? "Saving..."
            : "Save Article"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="articleTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter article title"
                        {...field}
                        data-testid="input-article-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="languageCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem
                              key={language.id}
                              value={language.languageCode}
                              data-testid={`option-language-${language.languageCode}`}
                            >
                              {language.languageCode} - {language.languageName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            value={
                              selectedAuthor
                                ? `${selectedAuthor.firstName || ""} ${selectedAuthor.lastName || ""}`.trim() ||
                                  selectedAuthor.email ||
                                  "Unknown"
                                : ""
                            }
                            readOnly
                            placeholder="Select author"
                            data-testid="input-author"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsUserLookupOpen(true)}
                            data-testid="button-select-author"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="articleFunctionalDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functional Domain</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Sales, Marketing, Finance"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-functional-domain"
                        />
                      </FormControl>
                      <FormDescription>
                        The business domain this article relates to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="articleFunctionalityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functionality Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Lead Management, Email Campaigns"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-functionality-name"
                        />
                      </FormControl>
                      <FormDescription>
                        The specific functionality this article covers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="articleTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., tutorial, how-to, reference"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-article-tags"
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated tags for categorization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="articleKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter keywords for search optimization"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-article-keywords"
                        rows={2}
                      />
                    </FormControl>
                    <FormDescription>
                      Keywords to help users find this article
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="articleContent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TiptapEditor
                        content={editorContent}
                        onChange={(html) => {
                          setEditorContent(html);
                          field.onChange(html);
                        }}
                        placeholder="Write your article content here..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      <UserLookupDialog
        open={isUserLookupOpen}
        onClose={() => setIsUserLookupOpen(false)}
        onSelect={handleAuthorSelect}
        selectedUserId={selectedAuthor?.id}
      />
    </div>
  );
}
