import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList";

export default function HealthToolsPage() {
  return (
    <OtherToolsList 
      toolType="health"
      pageTitle="Health Tools Management"
      apiEndpoint="/health-tools"   
      frontendPath="/dashboard/health-tools" 
      createPermission="createHealthCommonOtherTools"
      editPermission="editHealthCommonOtherTools"
      deletePermission="deleteHealthCommonOtherTools"
      statusChangePermission="healthCommonOtherToolsStatusChange"
      viewPermission="viewHealthCommonOtherToolsMenu"
    />
  );
}