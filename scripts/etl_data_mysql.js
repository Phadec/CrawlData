const xlsx = require('xlsx');
const mysql = require('mysql2/promise');

// File paths
const filePaths = [
    './data/cleaned_tivi_data_cellphones.xlsx',
    './data/cleaned_tivi_data_dienmayxanh.xlsx'
];

// MySQL connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Pha9124719@',
    database: 'tv_data_warehouse',
    port: 3306
};

// Connect to MySQL
async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database.');
        return connection;
    } catch (error) {
        console.error('Failed to connect to MySQL:', error);
        process.exit(1);
    }
}

// Read data from Excel file
function extractData(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    console.log(`Columns in ${filePath}:`, Object.keys(data[0])); // Log column names for verification
    return data;
}

// Function to clean price values
function cleanPrice(priceStr) {
    if (typeof priceStr === 'string') {
        const cleaned = priceStr.replace(/[^\d]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
    }
    return priceStr ? parseInt(priceStr, 10) : null;
}

// Function to clean discount percentage values
function cleanDiscount(discountStr) {
    if (typeof discountStr === 'string') {
        const match = discountStr.match(/\d+/);
        return match ? -parseInt(match[0], 10) : null;
    }
    return discountStr ? -parseInt(discountStr, 10) : null;
}

// General function to trim and clean string values
function cleanString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

// Function to clean numeric fields like release year
function cleanNumber(value) {
    return value ? parseInt(value, 10) : null;
}

// Transform and clean the data
function transformData(data) {
    return data.map((item) => {
        const transformedItem = {
            name: cleanString(item['name']),
            price: cleanPrice(item['price']),
            oldPrice: cleanPrice(item['oldPrice']),
            discountPercent: cleanDiscount(item['discountPercent']),
            productLink: cleanString(item['productLink']),
            screenSize: cleanString(item['screenSize']),
            resolution: cleanString(item['resolution']),
            screenType: cleanString(item['screenType']),
            operatingSystem: cleanString(item['operatingSystem']),
            imageTechnology: cleanString(item['imageTechnology']),
            processor: cleanString(item['processor']),
            refreshRate: cleanString(item['refreshRate']),
            speakerPower: cleanString(item['speakerPower']),
            internetConnection: cleanString(item['internetConnection']),
            wirelessConnectivity: cleanString(item['wirelessConnectivity']),
            usbPorts: cleanString(item['usbPorts']),
            videoAudioInputPorts: cleanString(item['videoAudioInputPorts']),
            audioOutputPorts: cleanString(item['audioOutputPorts']),
            manufacturer: cleanString(item['manufacturer']),
            manufacturedIn: cleanString(item['manufacturedIn']),
            releaseYear: cleanNumber(item['releaseYear'])
        };

        // Check if all values are null, indicating a potential mismatch
        if (Object.values(transformedItem).every(value => value === null)) {
            console.warn('All values are null for this item. Please check the column names.');
        }
        return transformedItem;
    });
}

// Load the data into MySQL
async function loadDataToDatabase(connection, data) {
    try {
        const tableName = 'tivi_data';

        // Create table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                price BIGINT,  -- Changed to BIGINT
                old_price BIGINT,  -- Changed to BIGINT
                discount_percent INT,
                product_link TEXT,
                screen_size VARCHAR(255),
                resolution VARCHAR(255),
                screen_type VARCHAR(255),
                operating_system VARCHAR(255),
                image_technology LONGTEXT,
                processor VARCHAR(255),
                refresh_rate VARCHAR(255),
                speaker_power VARCHAR(255),
                internet_connection VARCHAR(255),
                wireless_connectivity VARCHAR(255),
                usb_ports VARCHAR(255),
                video_audio_input_ports VARCHAR(255),
                audio_output_ports VARCHAR(255),
                manufacturer VARCHAR(255),
                manufactured_in VARCHAR(255),
                release_year INT
            );
        `;
        await connection.query(createTableQuery);
        console.log('Table created or already exists.');

        // Insert data into the table
        const insertQuery = `
            INSERT INTO ${tableName} (
                name, price, old_price, discount_percent, product_link, screen_size, resolution, screen_type,
                operating_system, image_technology, processor, refresh_rate, speaker_power, internet_connection,
                wireless_connectivity, usb_ports, video_audio_input_ports, audio_output_ports,
                manufacturer, manufactured_in, release_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        for (const item of data) {
            if (Object.values(item).some(value => value !== null)) { // Only insert if there is at least one non-null value
                console.log("Inserting item:", item); // Log the item before insertion
                await connection.query(insertQuery, [
                    item.name, item.price, item.oldPrice, item.discountPercent, item.productLink, item.screenSize,
                    item.resolution, item.screenType, item.operatingSystem, item.imageTechnology, item.processor,
                    item.refreshRate, item.speakerPower, item.internetConnection, item.wirelessConnectivity,
                    item.usbPorts, item.videoAudioInputPorts, item.audioOutputPorts, item.manufacturer,
                    item.manufacturedIn, item.releaseYear
                ]);
            } else {
                console.warn('Skipping item with all null values:', item);
            }
        }
        console.log('Data loaded successfully.');
    } catch (error) {
        console.error('Error loading data to MySQL:', error);
    }
}

// Main ETL function
async function etlProcess() {
    const connection = await connectToDatabase();
    try {
        for (const filePath of filePaths) {
            console.log(`Processing file: ${filePath}`);
            const extractedData = extractData(filePath);
            console.log(`Extracted Data Sample: ${JSON.stringify(extractedData[0])}`); // Log a sample of extracted data
            const transformedData = transformData(extractedData);
            console.log(`Transformed Data Sample: ${JSON.stringify(transformedData[0])}`); // Log a sample of transformed data
            await loadDataToDatabase(connection, transformedData);
        }
    } catch (error) {
        console.error('Error in ETL process:', error);
    } finally {
        // Close the connection after all files are processed
        await connection.end();
        console.log('MySQL connection closed.');
    }
}

// Execute the ETL process
etlProcess();
