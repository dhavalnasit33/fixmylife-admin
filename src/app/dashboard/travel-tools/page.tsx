import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList"; 

export default function TravelToolsPage() { 

  return (
    <OtherToolsList 
      toolType="travel"
      pageTitle="Destination Tools Management"
      apiEndpoint="/travel-tools"   
      frontendPath="/dashboard/travel-tools" 
      // ✅ Pass permissions
      viewPermission="viewTravelCommonOtherToolsMenu"
      createPermission="createTravelCommonOtherTools"
      editPermission="editTravelCommonOtherTools"
      deletePermission="deleteTravelCommonOtherTools"
      // ✅ Pass the Status Change permission string here
      statusChangePermission="travelCommonOtherToolsStatusChange"
    />
  );
}