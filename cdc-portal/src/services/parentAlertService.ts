import { apiRequest } from './apiClient';
import { ParentContact, ParentAlert, Student } from '../shared/types';

export const parentAlertService = {
  async getParentContact(): Promise<ParentContact> {
    const student = await apiRequest<Student>('/students/me', { portal: 'student' });
    return student.parentContact;
  },

  async updateParentContact(data: Partial<ParentContact>): Promise<ParentContact> {
    return apiRequest<ParentContact>('/students/me/parent-contact', {
      method: 'PATCH',
      portal: 'student',
      body: JSON.stringify(data),
    });
  },

  async verifyParentPhoneOtp(otp: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/parent-alerts/verify-otp', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify({ otp }),
    });
  },

  async getParentAlerts(): Promise<ParentAlert[]> {
    return apiRequest<ParentAlert[]>('/parent-alerts', { portal: 'student' });
  },

  async triggerParentAlertMock(alertId: string): Promise<ParentAlert | null> {
    const list = await this.getParentAlerts();
    return list.find(a => a.id === alertId) ?? null;
  },
};
