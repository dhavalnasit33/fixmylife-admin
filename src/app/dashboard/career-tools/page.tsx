import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList";

export default function CareerToolsPage() {
  return (
    <OtherToolsList 
      toolType="career"
      pageTitle="Career Tools Management"
      apiEndpoint="/career-tools"   
      frontendPath="/dashboard/career-tools"  
      createPermission="createCareerCommonOtherTools"
      editPermission="editCareerCommonOtherTools"
      deletePermission="deleteCareerCommonOtherTools"
      statusChangePermission="careerCommonOtherToolsStatusChange"
      viewPermission="viewCareerCommonOtherToolsMenu"
    />
  );
}