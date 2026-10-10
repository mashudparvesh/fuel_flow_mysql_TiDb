import fs from 'fs';
import path from 'path';

export interface DbLogEntry {
  id: string;
  timestamp: string;
  operation: string; // 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_IMPORT' | 'MANUAL_ENTRY' | 'SYNC'
  entityType: string; // 'vehicles' | 'tenants' | 'users' | 'pumps' | 'fuel_entries' | 'companies' | 'vendors' | etc.
  count: number;
  success: boolean;
  details?: string;
  error?: string | null;
}

const MAX_LOGS = 500;
let dbLogs: DbLogEntry[] = [];
const logFilePath = path.join(process.cwd(), '.db_operations.log');

export function logDbAction(
  operation: string,
  entityType: string,
  count: number,
  success: boolean,
  details?: string,
  error?: any
): DbLogEntry {
  const entry: DbLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    operation,
    entityType,
    count,
    success,
    details: details || '',
    error: error ? (typeof error === 'string' ? error : error?.message || JSON.stringify(error)) : null
  };

  dbLogs.unshift(entry);
  if (dbLogs.length > MAX_LOGS) {
    dbLogs = dbLogs.slice(0, MAX_LOGS);
  }

  const statusStr = success ? 'SUCCESS [ACKNOWLEDGED]' : 'FAILED [ERROR]';
  console.log(`[DB Logger] [${entry.timestamp}] ${entry.operation} (${entry.entityType}) - Count: ${entry.count} - Status: ${statusStr} ${entry.details ? `- Details: ${entry.details}` : ''} ${entry.error ? `- Error: ${entry.error}` : ''}`);

  try {
    fs.appendFileSync(logFilePath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    // Non-blocking file logging error
  }

  return entry;
}

export function getDbLogs(limit: number = 100): DbLogEntry[] {
  return dbLogs.slice(0, limit);
}

export function getDbLogStats() {
  const total = dbLogs.length;
  const successCount = dbLogs.filter(l => l.success).length;
  const failureCount = total - successCount;
  return {
    total_operations: total,
    successful: successCount,
    failed: failureCount,
    last_operation: dbLogs[0] || null
  };
}
