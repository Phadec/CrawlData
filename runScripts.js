const { exec } = require('child_process');
const path = require('path');

// Function to run a script with its path
function runScript(scriptName) {
    // Xác định đường dẫn tuyệt đối tới script trong thư mục 'scripts'
    const scriptPath = path.join(__dirname, 'scripts', scriptName);

    return new Promise((resolve, reject) => {
        const process = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error running ${scriptName}:`, error);
                reject(error);
            } else {
                if (stderr) {
                    console.error(`Error output from ${scriptName}: ${stderr}`);
                }
                console.log(`Output from ${scriptName}: ${stdout}`);
                resolve();
            }
        });

        process.on('exit', (code) => {
            console.log(`${scriptName} exited with code ${code}`);
        });
    });
}

// Run multiple scripts sequentially
async function runAllScripts() {
    try {
        console.log('Running CrawlDataDienMayXanh.js and CrawlDataCellPhoneS.js...');
        // Chạy hai script cùng lúc
        await Promise.all([
            runScript('CrawlDataDienMayXanh.js'),
            runScript('CrawlDataCellPhoneS.js')
        ]);

        console.log('Running CleanDataCellPhoneS.js and CleanDataDienMayXanh.js...');
        // Chạy tiếp hai script tiếp theo cùng lúc
        await Promise.all([
            runScript('CleanDataCellPhoneS.js'),
            runScript('CleanDataDienMayXanh.js')
        ]);

        console.log('Running etl_data_mysql.js...');
        // Chạy script cuối cùng
        await runScript('etl_data_mysql.js');

        console.log('All scripts have finished executing.');
    } catch (error) {
        console.error('An error occurred while running scripts:', error);
    }
}

// Execute the function
runAllScripts();
