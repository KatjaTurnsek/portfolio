// Single source of truth for BASE + asset helpers.
const RAW_BASE = window.__BASE_URL__ || import.meta?.env?.BASE_URL || '/';
// guarantee trailing slash
export const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

export const img = (file) => new URL(`${BASE}assets/images/${file}`, window.location.origin).href;

export const pdf = (file) => new URL(`${BASE}assets/pdf/${file}`, window.location.origin).href;
