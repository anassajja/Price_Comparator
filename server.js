const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const app = express();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;

// Function to perform web scraping for a single website and extract the product price
async function scrapePrice(url, productName) {
    try {
        const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            },
        });
        const html = response.data;
        const $ = cheerio.load(html);

  
      // Custom code to extract the product price
      const productRows = $('table tr');
      let price = '-';
  
      let foundProduct = false;
      productRows.each((index, row) => {
        const productNameCell = $(row).find('td:first-child').text().trim();
        if (productNameCell === productName) {
          // Assuming the price is in the next cell (second column)
          price = $(row).find('td:nth-child(2)').text().trim();
          foundProduct = true;
          return false; // Exit the loop once the product is found
        }
      });
  
      if (!foundProduct) {
        console.log(`Product "${productName}" not found on ${url}`);
        return "-";
    }

    // Return the extracted price
    console.log(`Scraping ${url} for price...`);
    console.log(`Product price for ${productName}: ${price}`);
    return price || "-";
} catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return "-";
}
}

  
// Function to fetch prices for all websites and return them as an object
async function fetchPrices() {
  const urls = [
    'https://atmostech.ma/',
    'https://marocproduits.com/', 
    'https://www.micro-planet.ma/', 
    'https://www.moussasoft.com/',
    'https://shoppingmaroc.net/',
    'https://marocarduino.com/',
    'https://shop4makers.com/',
    'https://electromashop.com/',
    'http://electromaroc.com/',
    'https://www.raspberry.ma/',
    'https://www.microcell.ma/',
    'https://www.jumia.ma/',
    // Add the URLs of the 11 e-commerce websites here
  ];

  const productPrices = {};

  for (const url of urls) {
    const price = await scrapePrice(url, 'Arduino Uno R3');
    productPrices[url] = price;
  }

  console.log(`Fetching prices from websites...`);
  console.log(productPrices);

  return productPrices;
}

// Endpoint to fetch product prices from the e-commerce websites
app.get('/api/prices', async (req, res) => {
    try {
      const productPrices = await fetchPrices();
  
      // Save the prices to a JSON file (data.json) on the server
      fs.writeFileSync(__dirname + '/data.json', JSON.stringify(productPrices, null, 2));
  
      // Send the productPrices object as a response to the front-end
      res.json(productPrices);
    } catch (error) {
      console.error('Error occurred while fetching prices:', error);
      res.status(500).json({ error: 'An error occurred while fetching prices.' });
    }
  });
  
  // Serve the Table-Prices.html file to the front-end
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Table-Prices.html');
  });
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });