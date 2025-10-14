import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { KnowledgeArticleWithAuthor } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function KnowledgeArticlesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: articles = [], isLoading } = useQuery<Omit<KnowledgeArticleWithAuthor, 'articleContent'>[]>({
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
          onClick={() => setLocation("/setup/knowledge-articles/new")}
          data-testid="button-create-article"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Article
        </Button>
      </div>

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
                  <TableHead>Domain / Functionality</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Created</TableHead>
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/setup/knowledge-articles/${article.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div data-testid={`text-title-${article.id}`}>
                              {article.articleTitle}
                            </div>
                            {article.articleKeywords && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {article.articleKeywords}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-domain-${article.id}`}>
                        <div>
                          {article.articleFunctionalDomain && (
                            <div className="font-medium">{article.articleFunctionalDomain}</div>
                          )}
                          {article.articleFunctionalityName && (
                            <div className="text-sm text-muted-foreground">
                              {article.articleFunctionalityName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-author-${article.id}`}>
                        {article.author?.firstName} {article.author?.lastName}
                      </TableCell>
                      <TableCell data-testid={`text-created-${article.id}`}>
                        {article.createdDate
                          ? format(new Date(article.createdDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/setup/knowledge-articles/${article.id}`)}
                            data-testid={`button-edit-article-${article.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-article-${article.id}`}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
