const { exec } = require('child_process');
const path = require('path');

// Function to run a script with its path
function runScript(scriptName) {
    // Xác định đường dẫn tuyệt đối tới script trong thư mục 'scripts'
    const scriptPath = path.join(__dirname, 'scripts', scriptName);

    return new Promise((resolve, reject) => {
        console.log(`\nStarting ${scriptName}...`);
        const startTime = new Date();

        const process = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
            const endTime = new Date();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            if (error) {
                console.error(`Error running ${scriptName} after ${duration} seconds:`, error);
                reject(error);
            } else {
                if (stderr) {
                    console.error(`Error output from ${scriptName}: ${stderr}`);
                }
                console.log(`Output from ${scriptName}: ${stdout}`);
                console.log(`${scriptName} finished successfully in ${duration} seconds.`);
                resolve();
            }
        });

        process.on('exit', (code) => {
            if (code === 0) {
                console.log(`${scriptName} exited with code ${code}.`);
            } else {
                console.error(`${scriptName} exited with code ${code}.`);
            }
        });
    });
}

// Run multiple scripts sequentially
async function runAllScripts() {
    try {
        console.log('Starting the ETL process...\n');

        console.log('Running CrawlDataDienMayXanh.js and CrawlDataCellPhoneS.js...');
        // Chạy hai script cùng lúc
        await Promise.all([
            runScript('CrawlDataDienMayXanh.js'),
            runScript('CrawlDataCellPhoneS.js')
        ]);

        console.log('\nRunning CleanDataCellPhoneS.js and CleanDataDienMayXanh.js...');
        // Chạy tiếp hai script tiếp theo cùng lúc
        await Promise.all([
            runScript('CleanDataCellPhoneS.js'),
            runScript('CleanDataDienMayXanh.js')
        ]);

        console.log('\nRunning ETLDataMySql.js...');
        // Chạy script cuối cùng
        await runScript('ETLDataMySql.js');

        console.log('\nAll scripts have finished executing successfully.');
    } catch (error) {
        console.error('An error occurred while running scripts:', error);
    }
}

// Execute the function
runAllScripts();
