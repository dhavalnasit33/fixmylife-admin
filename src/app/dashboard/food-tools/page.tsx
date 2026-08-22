import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList"; 

export default function FoodToolsPage() { 

  return (
    <OtherToolsList 
      toolType="food"
      pageTitle="Food Tools Management"
      apiEndpoint="/food-tools"   
      frontendPath="/dashboard/food-tools" 
      // ✅ Pass permissions
      viewPermission="viewFoodCommonOtherToolsMenu"
      createPermission="createFoodCommonOtherTools"
      editPermission="editFoodCommonOtherTools"
      deletePermission="deleteFoodCommonOtherTools"
      // ✅ Pass the Status Change permission string here
      statusChangePermission="foodCommonOtherToolsStatusChange"
    />
  );
}