import { restClient } from '@polygon.io/client-js';

const apiKey = 'Z2zYpeDRaQiuiy5mnPjYEyLjo0DCd8A5';
const rest = restClient(apiKey, 'https://api.polygon.io');

async function example_listTickers() {
  try {
    const response = await rest.reference.tickers({
      market: 'stocks',
      active: 'true',
      order: 'asc',
      limit: '100',
      sort: 'ticker',
    });
    console.log('Response:', response);
  } catch (e) {
    console.error('An error happened:', e);
  }
}

example_listTickers();
