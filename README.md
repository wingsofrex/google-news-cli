# Google News CLI

A polished, color-coded Node.js command-line application to fetch the latest news headlines from Google News RSS feeds. No API keys required.

## PART OF KAGGLE 5 DAYS OF AI

## Features
- 🚀 **Fast and Lightweight** – Fetches directly from Google News RSS.
- 🎨 **Beautiful Output** – Colorized headlines, source attribution, and relative publication times.
- 🏷️ **Categorized News** – Filter stories by topics (World, Tech, Business, Sports, Science, etc.).
- ⚙️ **Configurable Count** – Specify how many articles to display at once.
- ⏳ **Loading Indicator** – Active spinner while fetching data.

## Installation

To run this tool locally:

```bash
# Clone the repository
git clone https://github.com/wingsofrex/google-news-cli.git
cd google-news-cli

# Install dependencies
npm install
```

## Usage

Run the script using `node index.js` followed by the category and optional arguments:

```bash
# Get the top stories
node index.js

# Get technology news
node index.js technology

# Get 5 sports headlines
node index.js sports -n 5

# List all available categories
node index.js --list

# Show help
node index.js --help
```

### Options
- `-n, --count <N>`: Number of articles to show (default: `10`)
- `-l, --list`: List all available categories
- `-h, --help`: Show help screen

### Available Categories
- `top` (Top Stories)
- `world` (World News)
- `nation` (National News)
- `business` (Business)
- `technology` (Technology)
- `entertainment` (Entertainment)
- `sports` (Sports)
- `science` (Science)
- `health` (Health)

## License
MIT
