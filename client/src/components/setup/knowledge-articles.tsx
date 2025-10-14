import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, BookOpen, Trash2, Save, UserPlus } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { KnowledgeArticleWithAuthor, User, Language } from "@shared/schema";
import { insertKnowledgeArticleSchema } from "@shared/schema";
import { format } from "date-fns";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

type KnowledgeArticleForm = z.infer<typeof insertKnowledgeArticleSchema>;

// Detail View Component
function KnowledgeArticleDetail({ 
  article, 
  onClose 
}: { 
  article: KnowledgeArticleWithAuthor | "new"; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isUserLookupOpen, setIsUserLookupOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<User | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const isNewArticle = article === "new";

  // Fetch languages for the language selector
  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  // Fetch current user to set as default author for new articles
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
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
    if (!isNewArticle) {
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
    } else if (currentUser) {
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
      onClose();
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
      return await apiRequest("PATCH", `/api/knowledge-articles/${(article as KnowledgeArticleWithAuthor).id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles"] });
      toast({
        title: "Success",
        description: "Knowledge article updated successfully",
      });
      onClose();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
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
                        data-testid="editor-article-content"
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

// Main Component with Two-Pane Layout
export default function KnowledgeArticlesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticleWithAuthor | "new" | null>(null);
  const { toast } = useToast();

  const { data: articles = [], isLoading } = useQuery<KnowledgeArticleWithAuthor[]>({
    queryKey: ["/api/knowledge-articles"],
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (articleId: string) => apiRequest("DELETE", `/api/knowledge-articles/${articleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles"] });
      toast({
        title: "Success",
        description: "Knowledge article deleted successfully",
      });
      if (selectedArticle && selectedArticle !== "new") {
        setSelectedArticle(null);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete knowledge article",
      });
    },
  });

  const filteredArticles = articles.filter((article) => {
    const query = searchQuery.toLowerCase();
    return (
      article.articleTitle?.toLowerCase().includes(query) ||
      article.articleKeywords?.toLowerCase().includes(query) ||
      article.articleFunctionalDomain?.toLowerCase().includes(query) ||
      article.articleFunctionalityName?.toLowerCase().includes(query) ||
      article.author?.firstName?.toLowerCase().includes(query) ||
      article.author?.lastName?.toLowerCase().includes(query)
    );
  });

  const handleDeleteArticle = (articleId: string) => {
    deleteArticleMutation.mutate(articleId);
  };

  // Update selected article when articles data changes
  useEffect(() => {
    if (selectedArticle && selectedArticle !== "new" && articles.length > 0) {
      const updatedArticle = articles.find(
        (article) => article.id === selectedArticle.id
      );
      if (updatedArticle) {
        setSelectedArticle(updatedArticle);
      }
    }
  }, [articles, selectedArticle]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Knowledge Articles</h3>
            <p className="text-sm text-muted-foreground">
              Manage knowledge base articles and documentation
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading knowledge articles...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Articles</h3>
          <p className="text-sm text-muted-foreground">
            Manage knowledge base articles and documentation
          </p>
        </div>
        <Button
          onClick={() => setSelectedArticle("new")}
          data-testid="button-create-article"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Article
        </Button>
      </div>

      <PanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Left Panel - List */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="space-y-4 pr-4">
            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, keywords, domain, functionality, or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-article-search"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Articles List */}
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Articles ({filteredArticles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>
                      {searchQuery
                        ? "No knowledge articles match your search"
                        : "No knowledge articles found"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles
                        .sort((a, b) => {
                          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
                          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
                          return dateB - dateA;
                        })
                        .map((article) => (
                          <TableRow
                            key={article.id}
                            data-testid={`row-article-${article.id}`}
                            className={selectedArticle && selectedArticle !== "new" && selectedArticle.id === article.id ? "bg-muted/50" : ""}
                          >
                            <TableCell className="font-medium">
                              <button
                                onClick={() => setSelectedArticle(article)}
                                className="text-left hover:underline flex items-center space-x-3 w-full"
                                data-testid={`link-article-${article.id}`}
                              >
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div data-testid={`text-title-${article.id}`}>
                                    {article.articleTitle}
                                  </div>
                                  {article.articleFunctionalDomain && (
                                    <div className="text-xs text-muted-foreground">
                                      {article.articleFunctionalDomain}
                                      {article.articleFunctionalityName && ` / ${article.articleFunctionalityName}`}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-delete-article-${article.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Knowledge Article</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{article.articleTitle}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteArticle(article.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-testid={`button-confirm-delete-article-${article.id}`}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Panel - Detail View */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="pl-4">
            {selectedArticle ? (
              <KnowledgeArticleDetail
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select an article to view details</p>
                    <p className="text-sm mt-2">or click "Create Article" to add a new one</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
