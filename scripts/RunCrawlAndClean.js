const { exec } = require('child_process');
const path = require('path');
const xlsx = require('xlsx');

// Define the scripts to run in sequence
const scripts = [
  'CrawlDataCellPhoneS.js',
  'CrawlDataDienMayXanh.js',
  'CleanDataCellPhoneS.js',
  'CleanDataDienMayXanh.js'
];

// Function to execute a script
function executeScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n==========================================`);
    console.log(`Starting execution of: ${scriptName}`);
    console.log(`==========================================\n`);

    const scriptPath = path.join(__dirname, scriptName);
    const childProcess = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptName}: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`${scriptName} stderr: ${stderr}`);
      }
      
      console.log(`\n==========================================`);
      console.log(`Successfully completed: ${scriptName}`);
      console.log(`==========================================\n`);
      resolve();
    });

    // Forward script output to console in real-time
    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

// Thêm một bước kiểm tra sau cùng để đảm bảo tệp Excel tương thích SSIS
async function verifyExcelFormatting() {
  console.log(`\n\n==========================================`);
  console.log(`Verifying Excel formatting for SSIS compatibility...`);
  console.log(`==========================================\n`);
  
  const files = [
    path.join(__dirname, 'data', 'cleaned_tivi_data_cellphones.xlsx'),
    path.join(__dirname, 'data', 'cleaned_tivi_data_dienmayxanh.xlsx')
  ];
  
  for (const file of files) {
    console.log(`Checking file: ${file}`);
    
    try {
      // Read the Excel file
      const workbook = xlsx.readFile(file);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Kiểm tra các giá trị của cột imageTechnology
      let requiresFix = false;
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      for (const row of data) {
        if (row.imageTechnology && typeof row.imageTechnology === 'string') {
          const originalLength = row.imageTechnology.length;
          row.imageTechnology = row.imageTechnology
            .replace(/[\r\n\t]/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
          
          if (row.imageTechnology.length > 250) {
            row.imageTechnology = row.imageTechnology.substring(0, 250);
          }
          
          if (originalLength !== row.imageTechnology.length) {
            requiresFix = true;
          }
        }
      }
      
      if (requiresFix) {
        console.log(`File ${path.basename(file)} needs formatting adjustments for SSIS compatibility. Fixing...`);
        
        // Create a new workbook
        const newWorkbook = xlsx.utils.book_new();
        const newWorksheet = xlsx.utils.json_to_sheet(data);
        
        // Set proper cell types
        const column_names = Object.keys(data[0]);
        const cell_range = {s: {c:0, r:0}, e: {c:column_names.length - 1, r:data.length}};
        
        for(let C = cell_range.s.c; C <= cell_range.e.c; ++C) {
          for(let R = cell_range.s.r + 1; R <= cell_range.e.r; ++R) {
            const cell_address = {c:C, r:R};
            const cell_ref = xlsx.utils.encode_cell(cell_address);
            if(newWorksheet[cell_ref]) {
              // Set appropriate column types based on column name
              const columnName = column_names[C];
              if(columnName === 'price' || columnName === 'oldPrice' || 
                 columnName === 'discountPercent' || columnName === 'releaseYear') {
                // Keep these as numbers for SSIS
                newWorksheet[cell_ref].t = 'n';
              } else {
                // Mark all other cells as string type
                newWorksheet[cell_ref].t = 's';
              }
            }
          }
        }
        
        xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Cleaned Data');
        xlsx.writeFile(newWorkbook, file);
        console.log(`✓ Fixed ${path.basename(file)} for SSIS compatibility`);
      } else {
        console.log(`✓ File ${path.basename(file)} is properly formatted for SSIS`);
      }
    } catch (error) {
      console.error(`Error verifying ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n==========================================`);
  console.log(`Excel verification completed`);
  console.log(`==========================================\n`);
}

// Run scripts sequentially
async function runScriptsSequentially() {
  console.log('Starting Crawl and Clean process...');
  
  try {
    for (const script of scripts) {
      await executeScript(script);
    }
    console.log('All crawling and cleaning tasks completed successfully!');
    
    // Thêm bước kiểm tra tương thích SSIS ở cuối
    await verifyExcelFormatting();
    
    console.log('\nProcess completed. Excel files are now ready for SSIS import.');
  } catch (error) {
    console.error('Process terminated with an error:', error.message);
    process.exit(1);
  }
}

// Execute the main function
runScriptsSequentially();
