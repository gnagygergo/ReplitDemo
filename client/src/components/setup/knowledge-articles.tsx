/**
 * Knowledge Articles Management Component
 *
 * This file contains the complete implementation for managing knowledge base articles
 * with a two-pane layout (list + detail view) similar to the Release Management pattern.
 *
 * Components:
 * - KnowledgeArticleView: Read-only view mode for displaying article details
 * - KnowledgeArticleEdit: Form for creating/editing articles with rich text editor
 * - KnowledgeArticleDetail: Wrapper that toggles between view and edit modes
 * - KnowledgeArticlesManagement: Main component with two-pane layout (list + detail)
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Save,
  UserPlus,
  Edit,
  X,
  Info,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  KnowledgeArticleWithAuthor,
  User,
  Language,
  CompanySettingMasterDomain,
  CompanySettingMasterFunctionality,
} from "@shared/schema";
import { insertKnowledgeArticleSchema } from "@shared/schema";
import { format } from "date-fns";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type KnowledgeArticleForm = z.infer<typeof insertKnowledgeArticleSchema>;

/**
 * VIEW MODE COMPONENT
 *
 * Displays article details in read-only format
 * - Rich text content rendered as HTML
 * - Close and Edit action buttons
 */
function KnowledgeArticleView({
  article,
  onEdit,
  onClose,
}: {
  article: KnowledgeArticleWithAuthor;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Article</h3>
          <p className="text-sm text-muted-foreground">
            View article details and content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={onEdit} data-testid="button-edit-article">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Article Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>{article.articleTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language and Author - 2 column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Language
              </label>
              <p className="text-sm mt-1">
                {article.languageCode || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Author
              </label>
              <p className="text-sm mt-1">
                {article.author
                  ? `${article.author.firstName || ""} ${article.author.lastName || ""}`.trim() ||
                    article.author.email
                  : "Unknown"}
              </p>
            </div>
          </div>

          {/* Functional Domain and Functionality Name - 2 column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Functional Domain
              </label>
              <p className="text-sm mt-1">
                {article.articleFunctionalDomain || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Functionality Name
              </label>
              <p className="text-sm mt-1">
                {article.articleFunctionalityName || "Not specified"}
              </p>
            </div>
          </div>

          {/* Tags display (conditional) */}
          {article.articleTags && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {article.articleTags.split(",").map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Keywords display (conditional) */}
          {article.articleKeywords && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Keywords
              </label>
              <p className="text-sm mt-1">{article.articleKeywords}</p>
            </div>
          )}

          {/* Created Date display (conditional) */}
          {article.createdDate && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created Date
              </label>
              <p className="text-sm mt-1">
                {format(new Date(article.createdDate), "PPP")}
              </p>
            </div>
          )}

          {/* Publication and Access Status - 2 column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Published Status
              </label>
              <div className="mt-1">
                <Badge
                  variant={article.isPublished ? "default" : "secondary"}
                  data-testid="badge-is-published"
                >
                  {article.isPublished ? "Published" : "Not Published"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Access Level
              </label>
              <div className="mt-1">
                <Badge
                  variant={article.isInternal ? "outline" : "secondary"}
                  data-testid="badge-is-internal"
                >
                  {article.isInternal ? "Internal Only" : "Public"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Content Card - Rich text display */}
      <Card>
        <CardHeader>
          <CardTitle>Article Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render HTML content with sanitization handled by backend */}
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html:
                article.articleContent ||
                "<p class='text-muted-foreground'>No content available</p>",
            }}
            data-testid="view-article-content"
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * EDIT MODE COMPONENT
 *
 * Form for creating or editing knowledge articles with:
 * - Rich text editor (TiptapEditor) for article content
 * - Create/Update mutations with validation
 * - Cancel and Save actions
 */
function KnowledgeArticleEdit({
  article,
  onCancel,
  onSaved,
}: {
  article: KnowledgeArticleWithAuthor | "new";
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [isUserLookupOpen, setIsUserLookupOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<User | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const isNewArticle = article === "new";

  // Fetch languages for the language selector dropdown
  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  // Fetch functional domains for the dropdown
  const { data: functionalDomains = [] } = useQuery<CompanySettingMasterDomain[]>({
    queryKey: ["/api/company-setting-master-domains"],
  });

  // Fetch functionalities for the dropdown
  const { data: functionalities = [] } = useQuery<CompanySettingMasterFunctionality[]>({
    queryKey: ["/api/company-setting-master-functionalities"],
  });

  // Fetch current user to set as default author for new articles
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Initialize form with validation schema and default values
  const form = useForm<KnowledgeArticleForm>({
    resolver: zodResolver(insertKnowledgeArticleSchema),
    defaultValues: {
      articleTitle: "",
      articleCode: "",
      functionalDomainId: "",
      functionalityId: "",
      languageCode: "",
      articleFunctionalDomain: "",
      articleFunctionalityName: "",
      articleTags: "",
      articleKeywords: "",
      articleContent: "",
      authorId: "",
      isPublished: false,
      isInternal: false,
    },
  });

  // Populate form when editing existing article or set defaults for new article
  useEffect(() => {
    if (!isNewArticle) {
      // Load existing article data into form
      form.reset({
        articleTitle: article.articleTitle || "",
        articleCode: article.articleCode || "",
        functionalDomainId: article.functionalDomainId || "",
        functionalityId: article.functionalityId || "",
        languageCode: article.languageCode || "",
        articleFunctionalDomain: article.articleFunctionalDomain || "",
        articleFunctionalityName: article.articleFunctionalityName || "",
        articleTags: article.articleTags || "",
        articleKeywords: article.articleKeywords || "",
        articleContent: article.articleContent || "",
        authorId: article.authorId || "",
        isPublished: article.isPublished ?? false,
        isInternal: article.isInternal ?? false,
      });
      setEditorContent(article.articleContent || "");
      if (article.author) {
        setSelectedAuthor(article.author);
      }
    } else {
      // Initialize form with defaults for new article
      form.reset({
        articleTitle: "",
        articleCode: "",
        functionalDomainId: "",
        functionalityId: "",
        languageCode: "",
        articleFunctionalDomain: "",
        articleFunctionalityName: "",
        articleTags: "",
        articleKeywords: "",
        articleContent: "",
        authorId: currentUser?.id || "",
        isPublished: false,
        isInternal: false,
      });
      setEditorContent("");
      setSelectedAuthor(currentUser || null);
    }
  }, [article, currentUser, isNewArticle, form]);

  // Create new article mutation
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
      onSaved();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create knowledge article",
      });
    },
  });

  // Update existing article mutation
  const updateArticleMutation = useMutation({
    mutationFn: async (data: KnowledgeArticleForm) => {
      return await apiRequest(
        "PATCH",
        `/api/knowledge-articles/${(article as KnowledgeArticleWithAuthor).id}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles"] });
      toast({
        title: "Success",
        description: "Knowledge article updated successfully",
      });
      onSaved();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update knowledge article",
      });
    },
  });

  // Form submission handler - routes to create or update based on context
  const onSubmit = (data: KnowledgeArticleForm) => {
    // Merge form data with editor content
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

  // Author lookup dialog selection handler
  const handleAuthorSelect = (user: User) => {
    setSelectedAuthor(user);
    form.setValue("authorId", user.id);
  };

  return (
    <div className="space-y-6">
      {/* Header with Cancel and Save buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isNewArticle
              ? "Create Knowledge Article"
              : "Edit Knowledge Article"}
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
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={
              createArticleMutation.isPending || updateArticleMutation.isPending
            }
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
          {/* Article Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Article Title Field */}
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

              {/* Language and Author Fields - 2 column grid */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="languageCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
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

              {/* Article Code Field with help tooltip */}
              <FormField
                control={form.control}
                name="articleCode"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Article Code</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Use this code to embed this article to a certain Page.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Enter article code"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-article-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Functional Domain and Functionality - 2 column grid */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="functionalDomainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functional Domain</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-functional-domain">
                            <SelectValue placeholder="Select functional domain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {functionalDomains.map((domain) => (
                            <SelectItem
                              key={domain.id}
                              value={domain.id}
                              data-testid={`option-domain-${domain.id}`}
                            >
                              {domain.code} - {domain.name}
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
                  name="functionalityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functionality</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-functionality">
                            <SelectValue placeholder="Select functionality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {functionalities.map((functionality) => (
                            <SelectItem
                              key={functionality.id}
                              value={functionality.id}
                              data-testid={`option-functionality-${functionality.id}`}
                            >
                              {functionality.code} - {functionality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags Field */}
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

              {/* Keywords Field */}
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

              {/* Publication Status Checkboxes - 2 column grid */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-published"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Published</FormLabel>
                        <FormDescription>
                          Article is visible to users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isInternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-internal"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Internal Only</FormLabel>
                        <FormDescription>
                          Restricted to internal users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Article Content Card with Rich Text Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Rich Text Editor (TiptapEditor) */}
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

      {/* User Lookup Dialog for Author Selection */}
      <UserLookupDialog
        open={isUserLookupOpen}
        onClose={() => setIsUserLookupOpen(false)}
        onSelect={handleAuthorSelect}
        selectedUserId={selectedAuthor?.id}
      />
    </div>
  );
}

/**
 * DETAIL WRAPPER COMPONENT
 *
 * Manages the view/edit mode toggle for articles:
 * - Shows edit mode for new articles ("new")
 * - Shows view mode by default for existing articles
 * - Provides seamless switching between modes
 * - Handles cancel behavior (close for new, return to view for existing)
 */
function KnowledgeArticleDetail({
  article,
  onClose,
}: {
  article: KnowledgeArticleWithAuthor | "new";
  onClose: () => void;
}) {
  const [isEditMode, setIsEditMode] = useState(article === "new");

  // Reset edit mode when switching articles
  useEffect(() => {
    setIsEditMode(article === "new");
  }, [article]);

  // Handle cancel action based on context
  const handleCancel = () => {
    if (article === "new") {
      // New articles: Cancel closes the panel entirely
      onClose();
    } else {
      // Existing articles: Cancel returns to view mode
      setIsEditMode(false);
    }
  };

  // After successful save, close the panel
  const handleSaved = () => {
    onClose();
  };

  // Render edit mode for new articles or when edit button is clicked
  if (article === "new" || isEditMode) {
    return (
      <KnowledgeArticleEdit
        article={article}
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    );
  }

  // Render view mode for existing articles by default
  return (
    <KnowledgeArticleView
      article={article}
      onEdit={() => setIsEditMode(true)}
      onClose={onClose}
    />
  );
}

/**
 * MAIN COMPONENT - TWO-PANE LAYOUT
 *
 * Implements the Knowledge Articles management interface with:
 * - Left pane: Searchable list of all articles with delete action
 * - Right pane: Selected article detail (view or edit mode)
 * - Article list with search/filter functionality
 * - Create, Read, Update, Delete (CRUD) operations
 * - Performance optimization: List excludes content, detail fetches full article
 */
export default function KnowledgeArticlesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<
    string | "new" | null
  >(null);
  const { toast } = useToast();

  // Fetch article list (excludes content for performance)
  const { data: articles = [], isLoading } = useQuery<
    Omit<KnowledgeArticleWithAuthor, "articleContent">[]
  >({
    queryKey: ["/api/knowledge-articles"],
  });

  // Fetch complete article when selected (includes content for editing/viewing)
  const { data: selectedArticle, isLoading: isLoadingArticle } =
    useQuery<KnowledgeArticleWithAuthor>({
      queryKey: ["/api/knowledge-articles", selectedArticleId],
      enabled: !!selectedArticleId && selectedArticleId !== "new",
    });

  // Delete article mutation with optimistic UI update
  const deleteArticleMutation = useMutation({
    mutationFn: (articleId: string) =>
      apiRequest("DELETE", `/api/knowledge-articles/${articleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-articles"] });
      toast({
        title: "Success",
        description: "Knowledge article deleted successfully",
      });
      if (selectedArticleId && selectedArticleId !== "new") {
        setSelectedArticleId(null);
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

  // Filter articles based on search query (searches across multiple fields)
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

  // Delete handler
  const handleDeleteArticle = (articleId: string) => {
    deleteArticleMutation.mutate(articleId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
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
      {/* Two-Pane Layout: Left = Article List, Right = Article Detail */}
      <PanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Left Panel - Article List with Search and Create */}
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
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Knowledge Articles ({filteredArticles.length})
                  </CardTitle>
                  <Button
                    onClick={() => setSelectedArticleId("new")}
                    data-testid="button-create-article"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </Button>
                </div>
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
                          const dateA = a.createdDate
                            ? new Date(a.createdDate).getTime()
                            : 0;
                          const dateB = b.createdDate
                            ? new Date(b.createdDate).getTime()
                            : 0;
                          return dateB - dateA;
                        })
                        .map((article) => (
                          <TableRow
                            key={article.id}
                            data-testid={`row-article-${article.id}`}
                            className={
                              selectedArticleId === article.id
                                ? "bg-muted/50"
                                : ""
                            }
                          >
                            <TableCell className="font-medium">
                              <button
                                onClick={() => setSelectedArticleId(article.id)}
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
                                      {article.articleFunctionalityName &&
                                        ` / ${article.articleFunctionalityName}`}
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
                                    <AlertDialogTitle>
                                      Delete Knowledge Article
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {article.articleTitle}"? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteArticle(article.id)
                                      }
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

        {/* Resizable Divider */}
        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Panel - Article Detail (View/Edit Mode) */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="pl-4">
            {/* Create new article */}
            {selectedArticleId === "new" ? (
              <KnowledgeArticleDetail
                article="new"
                onClose={() => setSelectedArticleId(null)}
              />
            ) : selectedArticleId && isLoadingArticle ? (
              /* Loading selected article */
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center">
                    <div className="animate-pulse">Loading article...</div>
                  </div>
                </CardContent>
              </Card>
            ) : selectedArticleId && selectedArticle ? (
              /* Display selected article */
              <KnowledgeArticleDetail
                article={selectedArticle}
                onClose={() => setSelectedArticleId(null)}
              />
            ) : (
              /* Empty state - no article selected */
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select an article to view details</p>
                    <p className="text-sm mt-2">
                      or click "New" to add a new one
                    </p>
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
