import api from '../utils/api';

export interface ApprovalRequest {
  reason?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data?: any;
}

class ApprovalService {
  /**
   * Import approval operations
   */
  async approveImport(id: number): Promise<ApprovalResponse> {
    const response = await api.post(`/import/${id}/approve`);
    return response.data;
  }

  async rejectImport(id: number, reason: string): Promise<ApprovalResponse> {
    const response = await api.post(`/import/${id}/reject`, { reason });
    return response.data;
  }

  async getPendingImports(): Promise<any[]> {
    const response = await api.get('/import/pending');
    return response.data.data || [];
  }

  /**
   * Export approval operations
   */
  async approveExport(id: number): Promise<ApprovalResponse> {
    const response = await api.post(`/export/${id}/approve`);
    return response.data;
  }

  async rejectExport(id: number, reason: string): Promise<ApprovalResponse> {
    const response = await api.post(`/export/${id}/reject`, { reason });
    return response.data;
  }

  async getPendingExports(): Promise<any[]> {
    const response = await api.get('/export/pending');
    return response.data.data || [];
  }

  /**
   * Return approval operations
   */
  async approveReturn(id: number): Promise<ApprovalResponse> {
    const response = await api.post(`/return/${id}/approve`);
    return response.data;
  }

  async rejectReturn(id: number, reason: string): Promise<ApprovalResponse> {
    const response = await api.post(`/return/${id}/reject`, { reason });
    return response.data;
  }

  async getPendingReturns(): Promise<any[]> {
    const response = await api.get('/return/pending');
    return response.data.data || [];
  }

  /**
   * Waste approval operations
   */
  async approveWaste(id: number): Promise<ApprovalResponse> {
    const response = await api.post(`/waste/${id}/approve`);
    return response.data;
  }

  async rejectWaste(id: number, reason: string): Promise<ApprovalResponse> {
    const response = await api.post(`/waste/${id}/reject`, { reason });
    return response.data;
  }

  async getPendingWastes(): Promise<any[]> {
    const response = await api.get('/waste/pending');
    return response.data.data || [];
  }

  /**
   * Get all pending records for dashboard
   */
  async getAllPendingRecords(): Promise<{
    imports: any[];
    exports: any[];
    returns: any[];
    wastes: any[];
    totalCount: number;
  }> {
    try {
      const [imports, exports, returns, wastes] = await Promise.all([
        this.getPendingImports(),
        this.getPendingExports(),
        this.getPendingReturns(),
        this.getPendingWastes()
      ]);

      return {
        imports,
        exports,
        returns,
        wastes,
        totalCount: imports.length + exports.length + returns.length + wastes.length
      };
    } catch (error) {
      console.error('Error fetching pending records:', error);
      return {
        imports: [],
        exports: [],
        returns: [],
        wastes: [],
        totalCount: 0
      };
    }
  }
}

export default new ApprovalService(); 