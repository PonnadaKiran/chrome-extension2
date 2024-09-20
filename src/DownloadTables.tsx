// DownloadTables.tsx
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const DownloadTables = () => {

  // Function to handle downloading all tables as .xlsx files
  const handleDownloadTables = () => {
    // Query the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        // Execute script in the active tab to get all tables as HTML
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: getAllTablesAsHtml,  // Function that runs in the active tab
          },
          (results) => {
            if (results && results[0]?.result?.length) {
              const tableHtmlArray = results[0].result;
              if (tableHtmlArray.length > 0) {
                downloadTablesAsExcel(tableHtmlArray);  // Process and download the tables
              } else {
                alert("No valid tables found on the page.");
              }
            }
          }
        );
      }
    });
  };

  // Function that runs in the active tab to get all <table> elements
  const getAllTablesAsHtml = () => {
    const tables = Array.from(document.querySelectorAll('table')); // Select all tables
    return tables.map((table) => table.outerHTML);  // Return the outerHTML of each <table>
  };

  // Function to download tables as Excel files
  const downloadTablesAsExcel = (tableHtmlArray: string[]) => {
    tableHtmlArray.forEach((tableHtml, index) => {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = tableHtml;

      // Convert the HTML table to a worksheet
      const worksheet = XLSX.utils.table_to_sheet(tempElement.querySelector('table')!);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Table-${index + 1}`);

      // Generate the Excel file as a blob
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

      // Use file-saver to trigger the download of the Excel file
      saveAs(blob, `table-${index + 1}.xlsx`);
    });
  };

  return (
    <div>
      <button onClick={handleDownloadTables}>
        Download All Tables
      </button>
    </div>
  );
};

export default DownloadTables;




