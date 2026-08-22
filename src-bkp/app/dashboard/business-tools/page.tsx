import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList";

export default function BusinessToolsPage() {
  return (
    <OtherToolsList 
      toolType="business"
      pageTitle="Business Tools Management"
      apiEndpoint="/business-tools"   
      frontendPath="/dashboard/business-tools"  
      createPermission="createBusinessCommonOtherTools"
      editPermission="editBusinessCommonOtherTools"
      deletePermission="deleteBusinessCommonOtherTools"
      statusChangePermission="businessCommonOtherToolsStatusChange"
      viewPermission="viewBusinessCommonOtherToolsMenu"
    />
  );
}