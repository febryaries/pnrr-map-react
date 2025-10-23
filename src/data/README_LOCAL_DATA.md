# Real Data System

This directory contains the real data system for the PNRR Dashboard, which loads data from real PNRR data files instead of making API calls.

## Files

- `localDataLoader.js` - Main data loader that fetches real PNRR data from external sources
- `README_LOCAL_DATA.md` - This documentation file

## How It Works

The real data system fetches data from compressed JSON files hosted online and processes them through the same data aggregation classes used for API data. This ensures consistency while providing real, up-to-date data.

## Data Sources

The system fetches real data from the following sources:

- **Projects Data**: https://victorciobanu.com/bm/data/progres_tehnic_proiecte.json.gz
- **Payments Data**: https://victorciobanu.com/bm/data/plati_pnrr.json.gz  
- **Indicators Data**: https://victorciobanu.com/bm/data/indicatori_total.json.gz
- **Beneficiaries Data**: https://victorciobanu.com/bm/data/top_beneficiari.json.gz

### Data Features
- **Real PNRR data** from official sources
- **Compressed JSON files** for faster loading
- **Automatic decompression** using pako library
- **Fallback to sample data** if real data is unavailable
- **Complete project information** including CRI codes, components, and funding sources

### Performance Optimizations
- **Intelligent Caching**: 5-minute cache for all data to avoid redundant requests
- **Parallel Loading**: All data sources load simultaneously using Promise.allSettled
- **Preloading**: Critical data (projects and payments) loads first for faster initial display
- **Request Optimization**: 30-second timeout, proper headers, and compression support
- **Error Resilience**: Individual data source failures don't block other data
- **Memory Management**: Automatic cache expiration and cleanup

## Usage

The real data system is automatically used when the application starts. The data is loaded through:

1. `useLocalData` hook - Replaces `useDataEndpoint` hook
2. `LocalDataService` - Handles data loading and caching
3. `localDataLoader.js` - Fetches real data from external sources

## Benefits

- **Real Data**: Uses actual PNRR data from official sources
- **Ultra-Fast Loading**: Intelligent caching and parallel loading for optimal performance
- **Reliable**: Fallback to sample data if real data fails
- **Consistent**: Same data structure as API data
- **Up-to-date**: Real data that reflects current PNRR status
- **Comprehensive**: Includes all available data sources
- **Optimized**: Multiple performance improvements for faster user experience

## Data Structure

The real data follows the same structure as the API data:

- **Projects**: Uses `RawAPIData` interface for project records
- **Payments**: Uses `RawAPIData` interface for payment records
- **Processing**: Data is processed through `ProjectDataAggregation` and `PaymentDataAggregation` classes

## Fallback System

If the real data files are unavailable, the system automatically falls back to sample data to ensure the application continues to work.

## Switching Back to API

To switch back to API data loading:

1. Change `useLocalData` back to `useDataEndpoint` in `src/App.jsx`
2. The application will automatically use the API-based data loading system

## Dependencies

- **pako**: For decompressing gzipped data files
- **fetch**: For downloading data files from URLs

## Notes

- The real data provides comprehensive and up-to-date PNRR information
- All filtering and search functionality works with the real data
- The data includes all available components, counties, and project types
- Automatic decompression handles gzipped files seamlessly
