import OtherToolsList from "@/components/dashboard/other-tools/OtherToolsList";

export default function FinanceToolsPage() {
  return (
    <OtherToolsList 
      toolType="finance"
      pageTitle="Finance Tools Management"
      apiEndpoint="/finance-tools"   
      frontendPath="/dashboard/finance-tools"  
      createPermission="createFinanceCommonOtherTools"
      editPermission="editFinanceCommonOtherTools"
      viewPermission="viewFinanceCommonOtherToolsMenu"
      deletePermission="deleteFinanceCommonOtherTools"
      statusChangePermission="financeCommonOtherToolsStatusChange"
    />
  );
}