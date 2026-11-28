import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Eye,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { parentAlertService } from '../../services/parentAlertService';
import { eligibilityService } from '../../services/companyService';
import { applicationService } from '../../services/applicationService';
import { subscribeToStore } from '../../services/storeEvents';
import {
  ParentAlert,
  ParentContact,
  ParentAlertDeliveryStatus,
  EligibilityStatus,
} from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatDateTime } from '../../shared/utils';

export const ParentAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<ParentAlert[]>([]);
  const [parentContact, setParentContact] = useState<ParentContact | null>(null);
  const [pendingCompanies, setPendingCompanies] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ParentAlertDeliveryStatus>('ALL');
  const [previewAlert, setPreviewAlert] = useState<ParentAlert | null>(null);

  const loadData = async () => {
    const [list, contact, summaries, apps] = await Promise.all([
      parentAlertService.getParentAlerts(),
      parentAlertService.getParentContact(),
      eligibilityService.getAllEligibilitySummaries(),
      applicationService.getApplications(),
    ]);
    setAlerts(list);
    setParentContact(contact);
    const appliedIds = apps.map(a => a.companyId);
    const eligibleUnappliedNames = Array.from(
      new Set(
        summaries
          .filter(s => s.result.overallStatus === EligibilityStatus.ELIGIBLE && !appliedIds.includes(s.company.id))
          .map(s => s.company.name)
      )
    );
    setPendingCompanies(eligibleUnappliedNames);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore('cdc_parent_alerts', loadData);
    const unsubStudent = subscribeToStore('cdc_student', loadData);
    return () => {
      unsub();
      unsubStudent();
    };
  }, []);

  const alertsSent = alerts.filter(a => a.deliveryStatus === ParentAlertDeliveryStatus.DELIVERED || a.deliveryStatus === ParentAlertDeliveryStatus.SENT).length;
  const scheduledAlerts = alerts.filter(a => a.deliveryStatus === ParentAlertDeliveryStatus.SCHEDULED).length;
  const pendingCompaniesCount = pendingCompanies.length;

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.deliveryStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Parent / Guardian Notification Tracking</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Automated compliance reminders dispatched when eligible recruitment opportunities approach application deadlines
          </p>
        </div>

        <Link
          to="/student/profile/personal"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EAF2FF] hover:bg-blue-100 text-[#2855A6] text-xs font-bold rounded-xl border border-blue-200 transition self-start sm:self-auto"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Edit Parent Contact Details</span>
        </Link>
      </div>

      {/* 1. Summary Cards (UI Spec Section B) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
              Alerts Dispatched
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{alertsSent}</span>
            <span className="text-[11px] text-slate-500">Delivered to verified phone</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
              Scheduled Queue
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{scheduledAlerts}</span>
            <span className="text-[11px] text-slate-500">Impending deadline triggers</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
              Eligible & Unapplied
            </span>
            <span className="text-2xl font-bold text-[#2855A6] mt-1 block">{pendingCompaniesCount}</span>
            <span className="text-[11px] text-slate-500">
              {pendingCompanies.length > 0 ? pendingCompanies.join(', ') : 'All eligible drives applied'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2855A6] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Automated Alert Rules & Schedule Timeline (UI Spec Section B.2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider">
              Transparent Notification Schedule & Policies
            </h3>
            <p className="text-xs text-[#78869A] mt-0.5">
              How and when automated messages are transmitted to your registered parent
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Registered: {parentContact?.name || 'Parent Contact'} ({parentContact?.phone || 'Not set'})
          </span>
        </div>

        {/* Schedule Timeline Horizontal Progression */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-bold text-[#2855A6] uppercase tracking-wider block">
              1. 3 Days Before Deadline
            </span>
            <h4 className="text-xs font-bold text-slate-800">First Reminder</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Informs parent that student is Eligible and application window closes shortly.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              2. 1 Day Before Deadline
            </span>
            <h4 className="text-xs font-bold text-slate-800">Urgent Notice</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Urges parent to remind student to confirm their application before the 24-hour cutoff.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              3. Deadline Day
            </span>
            <h4 className="text-xs font-bold text-slate-800">Final Hours Call</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Dispatched on the morning of the closing date if application is still unconfirmed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              4. Post-Deadline
            </span>
            <h4 className="text-xs font-bold text-slate-800">Missed Opportunity Log</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Notifies parent: "Your ward did not submit an application for this drive."
            </p>
          </div>
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[#2855A6] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>Policy Exception:</strong> Alerts are NEVER triggered if the student is <code>Not Eligible</code> or if profile data is <code>Pending Verification</code>.
          </span>
        </div>
      </div>

      {/* 3. Notification Log Table (UI Spec Section B.4) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Alert Log & Scheduled Dispatches</h3>
            <p className="text-xs text-[#78869A] mt-0.5">
              Chronological log of alerts scheduled and sent via WhatsApp / SMS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value={ParentAlertDeliveryStatus.DELIVERED}>Delivered</option>
              <option value={ParentAlertDeliveryStatus.SCHEDULED}>Scheduled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Eligibility</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Application Deadline</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Alert Type</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Sent To</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Channel</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.map(alert => (
                <tr key={alert.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">{alert.companyName}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status="ELIGIBLE" />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {formatDate(alert.applicationDeadline)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{alert.alertType}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{alert.recipientMaskedPhone}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      {alert.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {alert.sentDate ? formatDateTime(alert.sentDate) : `Scheduled: ${formatDate(alert.scheduledDate)}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={alert.deliveryStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setPreviewAlert(alert)}
                      className="px-2.5 py-1 text-xs font-bold text-[#2855A6] hover:bg-blue-50 rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Preview Modal (UI Spec Section B.3) */}
      {previewAlert && (
        <Modal
          isOpen={!!previewAlert}
          onClose={() => setPreviewAlert(null)}
          title="Parent Alert Message Preview"
          subtitle={`Dispatched to ${parentContact?.name || 'Parent/Guardian'} (${previewAlert.recipientMaskedPhone}) via ${previewAlert.channel}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Simulated WhatsApp bubble */}
            <div className="bg-[#EFEAE2] p-4 rounded-2xl shadow-inner border border-stone-300 space-y-2">
              <div className="bg-white p-4 rounded-xl shadow-xs border border-stone-200 max-w-sm ml-auto space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CDC Institutional Bot</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-sans">
                  "{previewAlert.sampleMessage}"
                </p>
                <div className="text-right text-[10px] text-stone-400">
                  {previewAlert.sentDate ? formatDateTime(previewAlert.sentDate) : 'Scheduled Dispatch'} ✓✓
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
              <div>
                <strong>Trigger Reason:</strong> Student is verified Eligible for <strong>{previewAlert.companyName}</strong>, but application has not yet been registered.
              </div>
              <div>
                <strong>Delivery Route:</strong> Official SMS/WhatsApp gateway. Reply messages are redirected to the CDC placement desk.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewAlert(null)}
                className="px-4 py-2 bg-[#2855A6] text-white font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
