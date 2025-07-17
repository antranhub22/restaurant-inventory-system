import { api } from '../utils/api';
import { 
  VarianceData, 
  VarianceFilter, 
  VarianceReport, 
  VarianceActionRequest,
  VarianceActionResponse,
  VarianceApiResponse 
} from '../types/variance';

class VarianceService {
  private baseUrl = '/api/reconciliation';

  /**
   * Get variance report with filters
   */
  async getVarianceReport(filters: VarianceFilter): Promise<VarianceReport> {
    try {
      const response = await api.get<VarianceApiResponse>(`${this.baseUrl}/report`, {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch variance report');
      }
    } catch (error: any) {
      console.error('Error fetching variance report:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch variance report');
    }
  }

  /**
   * Get variance details by ID
   */
  async getVarianceById(id: number): Promise<VarianceData> {
    try {
      const response = await api.get<{ success: boolean; data: VarianceData }>(`${this.baseUrl}/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch variance details');
      }
    } catch (error: any) {
      console.error('Error fetching variance details:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch variance details');
    }
  }

  /**
   * Approve, reject, or investigate a variance
   */
  async processVariance(request: VarianceActionRequest): Promise<VarianceData> {
    try {
      const response = await api.post<VarianceActionResponse>(`${this.baseUrl}/${request.varianceId}/action`, request);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to process variance');
      }
    } catch (error: any) {
      console.error('Error processing variance:', error);
      throw new Error(error.response?.data?.message || 'Failed to process variance');
    }
  }

  /**
   * Generate variance report for export
   */
  async exportVarianceReport(filters: VarianceFilter, format: 'excel' | 'pdf' | 'csv'): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/export`, {
        params: { ...filters, format },
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error exporting variance report:', error);
      throw new Error(error.response?.data?.message || 'Failed to export variance report');
    }
  }

  /**
   * Get reconciliation data for variance analysis
   * This integrates with the existing reconciliation system
   */
  async getReconciliationVariances(filters: VarianceFilter): Promise<VarianceData[]> {
    try {
      const response = await api.get<{ success: boolean; data: VarianceData[] }>(`${this.baseUrl}/variances`, {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch reconciliation variances');
      }
    } catch (error: any) {
      console.error('Error fetching reconciliation variances:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch reconciliation variances');
    }
  }

  /**
   * Create variance from reconciliation discrepancy
   */
  async createVarianceFromReconciliation(reconciliationId: number, reason: string): Promise<VarianceData> {
    try {
      const response = await api.post<{ success: boolean; data: VarianceData }>(`${this.baseUrl}/from-reconciliation`, {
        reconciliationId,
        reason
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to create variance from reconciliation');
      }
    } catch (error: any) {
      console.error('Error creating variance from reconciliation:', error);
      throw new Error(error.response?.data?.message || 'Failed to create variance from reconciliation');
    }
  }

  /**
   * Get dashboard stats for variance overview
   */
  async getVarianceDashboardStats(filters?: Partial<VarianceFilter>) {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard`, {
        params: filters
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching variance dashboard stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch variance dashboard stats');
    }
  }

  /**
   * Mock data generator for development
   * This will be replaced with real API calls in production
   */
  generateMockVarianceData(filters: VarianceFilter): VarianceReport {
    const mockVariances: VarianceData[] = [
      {
        id: 1,
        itemId: 1,
        itemName: 'Gà ta',
        department: 'kitchen',
        shiftDate: '2024-01-15',
        shiftType: 'afternoon',
        
        expectedStock: 50,
        expectedWithdrawn: 45,
        expectedSold: 40,
        expectedReturned: 2,
        expectedWasted: 1,
        expectedStaffConsumed: 1,
        expectedSampled: 1,
        
        actualStock: 47,
        actualWithdrawn: 45,
        actualSold: 40,
        actualReturned: 2,
        actualWasted: 3,
        actualStaffConsumed: 1,
        actualSampled: 1,
        
        stockVariance: -3,
        withdrawnVariance: 0,
        soldVariance: 0,
        returnedVariance: 0,
        wastedVariance: 2,
        staffConsumedVariance: 0,
        sampledVariance: 0,
        
        stockVariancePercent: -6.0,
        withdrawnVariancePercent: 0,
        soldVariancePercent: 0,
        returnedVariancePercent: 0,
        wastedVariancePercent: 200,
        staffConsumedVariancePercent: 0,
        sampledVariancePercent: 0,
        
        stockVarianceValue: -150000,
        withdrawnVarianceValue: 0,
        soldVarianceValue: 0,
        returnedVarianceValue: 0,
        wastedVarianceValue: 100000,
        staffConsumedVarianceValue: 0,
        sampledVarianceValue: 0,
        totalVarianceValue: -50000,
        
        status: 'investigation',
        alertLevel: 'medium',
        reason: 'Hỏng trong quá trình chế biến',
        
        createdAt: '2024-01-15T14:30:00Z',
        createdBy: 1,
        reviewedAt: '2024-01-15T15:00:00Z',
        reviewedBy: 2
      },
      {
        id: 2,
        itemId: 2,
        itemName: 'Bia Saigon',
        department: 'bar',
        shiftDate: '2024-01-15',
        shiftType: 'evening',
        
        expectedStock: 100,
        expectedWithdrawn: 90,
        expectedSold: 85,
        expectedReturned: 0,
        expectedWasted: 2,
        expectedStaffConsumed: 2,
        expectedSampled: 1,
        
        actualStock: 98,
        actualWithdrawn: 90,
        actualSold: 85,
        actualReturned: 0,
        actualWasted: 4,
        actualStaffConsumed: 2,
        actualSampled: 1,
        
        stockVariance: -2,
        withdrawnVariance: 0,
        soldVariance: 0,
        returnedVariance: 0,
        wastedVariance: 2,
        staffConsumedVariance: 0,
        sampledVariance: 0,
        
        stockVariancePercent: -2.0,
        withdrawnVariancePercent: 0,
        soldVariancePercent: 0,
        returnedVariancePercent: 0,
        wastedVariancePercent: 100,
        staffConsumedVariancePercent: 0,
        sampledVariancePercent: 0,
        
        stockVarianceValue: -60000,
        withdrawnVarianceValue: 0,
        soldVarianceValue: 0,
        returnedVarianceValue: 0,
        wastedVarianceValue: 60000,
        staffConsumedVarianceValue: 0,
        sampledVarianceValue: 0,
        totalVarianceValue: 0,
        
        status: 'approved',
        alertLevel: 'low',
        reason: 'Vỡ chai trong quá trình phục vụ',
        
        createdAt: '2024-01-15T20:30:00Z',
        createdBy: 3,
        approvedAt: '2024-01-15T21:00:00Z',
        approvedBy: 2
      }
    ];

    return {
      filters,
      stats: {
        totalVariances: mockVariances.length,
        positiveVariances: 0,
        negativeVariances: 2,
        criticalVariances: 0,
        pendingVariances: 1,
        totalVarianceValue: -50000,
        averageVariancePercent: -4.0
      },
      trend: [
        { date: '2024-01-10', totalVariances: 3, totalValue: 120000, criticalCount: 0, averagePercent: 2.5 },
        { date: '2024-01-11', totalVariances: 2, totalValue: 80000, criticalCount: 0, averagePercent: 1.8 },
        { date: '2024-01-12', totalVariances: 4, totalValue: 150000, criticalCount: 1, averagePercent: 3.2 },
        { date: '2024-01-13', totalVariances: 1, totalValue: 40000, criticalCount: 0, averagePercent: 1.2 },
        { date: '2024-01-14', totalVariances: 3, totalValue: 90000, criticalCount: 0, averagePercent: 2.1 },
        { date: '2024-01-15', totalVariances: 2, totalValue: 50000, criticalCount: 0, averagePercent: 1.5 }
      ],
      byDepartment: [
        { departmentId: 1, departmentName: 'Bếp', varianceCount: 1, totalVarianceValue: 50000, criticalCount: 0, averageVariancePercent: 6.0 },
        { departmentId: 2, departmentName: 'Quầy bar', varianceCount: 1, totalVarianceValue: 0, criticalCount: 0, averageVariancePercent: 2.0 }
      ],
      byReason: [
        { reason: 'Hỏng trong quá trình chế biến', count: 1, totalValue: 50000, averageValue: 50000, percentage: 50 },
        { reason: 'Vỡ chai trong quá trình phục vụ', count: 1, totalValue: 0, averageValue: 0, percentage: 50 }
      ],
      byItem: [
        { itemId: 1, itemName: 'Gà ta', itemSku: 'GA001', categoryName: 'Thịt', varianceCount: 1, totalVarianceValue: 50000, averageVariancePercent: 6.0, lastVarianceDate: '2024-01-15' },
        { itemId: 2, itemName: 'Bia Saigon', itemSku: 'BIA001', categoryName: 'Đồ uống', varianceCount: 1, totalVarianceValue: 0, averageVariancePercent: 2.0, lastVarianceDate: '2024-01-15' }
      ],
      variances: mockVariances,
      generatedAt: new Date().toISOString(),
      generatedBy: 1
    };
  }
}

export const varianceService = new VarianceService();
export default varianceService; 