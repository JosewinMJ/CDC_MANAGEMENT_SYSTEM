import { apiRequest } from './apiClient';
import { notifyStore } from './storeEvents';
import { ParentContact, ParentAlert, Student } from '../shared/types';

export const parentAlertService = {
  async getParentContact(): Promise<ParentContact> {
    const student = await apiRequest<Student>('/students/me', { portal: 'student' });
    return student.parentContact;
  },

  async updateParentContact(data: Partial<ParentContact>): Promise<ParentContact> {
    const res = await apiRequest<ParentContact>('/students/me/parent-contact', {
      method: 'PATCH',
      portal: 'student',
      body: JSON.stringify(data),
    });
    notifyStore('cdc_student');
    notifyStore('cdc_parent_alerts');
    return res;
  },

  async verifyParentPhoneOtp(otp: string): Promise<{ success: boolean; message: string }> {
    const res = await apiRequest<{ success: boolean; message: string }>('/parent-alerts/verify-otp', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify({ otp }),
    });
    notifyStore('cdc_student');
    return res;
  },

  async getParentAlerts(): Promise<ParentAlert[]> {
    return apiRequest<ParentAlert[]>('/parent-alerts', { portal: 'student' });
  },
};
