import { db } from './storage';
import { ParentContact, ParentAlert, ParentAlertDeliveryStatus, UserRole } from '../shared/types';

export const parentAlertService = {
  async getParentContact(): Promise<ParentContact> {
    const student = db.getStudent();
    return Promise.resolve(student.parentContact);
  },

  async updateParentContact(data: Partial<ParentContact>): Promise<ParentContact> {
    const student = db.getStudent();
    const updatedContact: ParentContact = {
      ...student.parentContact,
      ...data,
      isVerified: data.phone !== student.parentContact.phone ? false : student.parentContact.isVerified,
    };

    db.setStudent({
      ...student,
      parentContact: updatedContact,
    });

    return Promise.resolve(updatedContact);
  },

  async verifyParentPhoneOtp(otp: string): Promise<{ success: boolean; message: string }> {
    // Simulated OTP check: accept 123456 or any 6-digit OTP in demo
    if (otp === '123456' || otp.length === 6) {
      const student = db.getStudent();
      const updatedContact: ParentContact = {
        ...student.parentContact,
        isVerified: true,
        lastVerifiedAt: new Date().toISOString(),
      };
      db.setStudent({
        ...student,
        parentContact: updatedContact,
      });
      return Promise.resolve({ success: true, message: 'Parent contact successfully verified via OTP.' });
    }
    return Promise.resolve({ success: false, message: 'Invalid OTP code. Please enter valid 6-digit code (Use demo code: 123456).' });
  },

  async getParentAlerts(): Promise<ParentAlert[]> {
    return Promise.resolve(db.getParentAlerts());
  },

  // Mock function for simulating sending of scheduled alert
  async triggerParentAlertMock(alertId: string): Promise<ParentAlert | null> {
    const alerts = db.getParentAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.deliveryStatus = ParentAlertDeliveryStatus.DELIVERED;
    alert.sentDate = new Date().toISOString();
    db.setParentAlerts(alerts);

    // Audit log
    const student = db.getStudent();
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: 'system-alert-daemon',
      actorName: 'Automated Parent Notification Daemon',
      actorRole: UserRole.ADMIN_STAFF,
      action: 'DISPATCHED_PARENT_ALERT',
      entityType: 'ParentAlert',
      entityId: alert.id,
      details: `Delivered ${alert.alertType} to ${alert.recipientMaskedPhone} via ${alert.channel}`,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(alert);
  },
};
