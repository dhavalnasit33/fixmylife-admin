import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList"; 

export default function WritingToolsPage() { 

  return (
    <OtherToolsList 
      toolType="writing"
      pageTitle="Writing Tools Management"
      apiEndpoint="/writing-tools"   
      frontendPath="/dashboard/writing-tools" 
      // ✅ Pass permissions
      viewPermission="viewWritingCommonOtherToolsMenu"
      createPermission="createWritingCommonOtherTools"
      editPermission="editWritingCommonOtherTools"
      deletePermission="deleteWritingCommonOtherTools"
      // ✅ Pass the Status Change permission string here
      statusChangePermission="writingCommonOtherToolsStatusChange"
    />
  );
}