// components/dashboard/news-categories/CategoryRow.tsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { NewsCategory } from "@/types";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

type CategoryRowProps = {
  category: NewsCategory;
  parentName?: string;
  level?: number;
  selectedMultiple: NewsCategory[];
  toggleSelectOne: (cat: NewsCategory) => void;
  handleToggleActive: (cat: NewsCategory) => void;
  setSelectedCategory: (cat: NewsCategory) => void;
  setIsEditDialogOpen: (val: boolean) => void;
  setIsDeleteDialogOpen: (val: boolean) => void;
};

export default function CategoryRow({
  category,
  parentName,
  level = 0,
  selectedMultiple,
  toggleSelectOne,
  handleToggleActive,
  setSelectedCategory,
  setIsEditDialogOpen,
  setIsDeleteDialogOpen,
}: CategoryRowProps) {
  const isSelected = selectedMultiple.some((c) => c._id === category._id);
  const { hasPermission } = useAuth();
  const canEditNewscategories = hasPermission("editNewsCategoryMenu");
  const canDeleteNewscategories = hasPermission("deleteNewsCategoryMenu");
  const canUpdateNewsCategories = hasPermission("newsCategoryMenuStatusChange");
  return (
    <>
      <TableRow className={level > 0 ? "bg-muted/20" : ""}>
        {canDeleteNewscategories && (
          <TableCell>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectOne(category)}
            />
          </TableCell>
        )}
        <TableCell>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: `${level * 1.5}rem`,
            }}
          >
            {level > 0 && <span style={{ marginRight: "0.5rem" }}>└─</span>}
            <span>{category.name}</span>
          </div>
        </TableCell>
        <TableCell>{category.description}</TableCell>
        <TableCell>{parentName ?? "—"}</TableCell>
        <TableCell>{category.newsCount}</TableCell>
        {canUpdateNewsCategories && (
          <TableCell className="text-center">
            <Switch
              checked={category.is_active}
              onCheckedChange={() => handleToggleActive(category)}
              aria-label={`Toggle ${category.name} status`}
            />
          </TableCell>
        )}
        {(canDeleteNewscategories || canEditNewscategories) && (
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditNewscategories && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDeleteNewscategories && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>

      {(category.children || []).map((child) => (
        <CategoryRow
          key={child._id}
          category={child}
          parentName={category.name}
          level={level + 1}
          selectedMultiple={selectedMultiple}
          toggleSelectOne={toggleSelectOne}
          handleToggleActive={handleToggleActive}
          setSelectedCategory={setSelectedCategory}
          setIsEditDialogOpen={setIsEditDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        />
      ))}
    </>
  );
}
