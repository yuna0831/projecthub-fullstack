"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roleName: string, answers: Record<string, string>) => void;
  roles: { id: string; name: string; count: number; skills: string[] }[];
  projectTitle: string;
  screeningQuestions: string[];
  userProfile?: { githubUrl?: string | null; linkedinUrl?: string | null };
}

export default function ApplyModal({ isOpen, onClose, onConfirm, roles, projectTitle, screeningQuestions, userProfile }: ApplyModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showProfileWarning, setShowProfileWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setAnswers({});
      setSelectedRole(null);
      // Check profile
      if (userProfile && (!userProfile.githubUrl && !userProfile.linkedinUrl)) {
        setShowProfileWarning(true);
      } else {
        setShowProfileWarning(false);
      }
    }
  }, [isOpen, userProfile]);

  const handleSubmit = () => {
    if (selectedRole) {
      // Validate answers
      const allAnswered = screeningQuestions.every(q => answers[q] && answers[q].trim().length > 0);
      if (screeningQuestions.length > 0 && !allAnswered) {
        alert("Please answer all screening questions.");
        return;
      }

      onConfirm(selectedRole, answers);
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 leading-tight">
                    Apply to <span className="text-[#c5050c]">{projectTitle}</span>
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-2 space-y-6">
                  {/* Profile Warning */}
                  {showProfileWarning && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-yellow-800 text-sm">Profile Incomplete</h4>
                        <p className="text-xs text-yellow-700 mt-1">
                          Your profile is missing GitHub or LinkedIn links. Adding them increases your chances of acceptance!
                          <a href="/profile" className="underline font-bold ml-1 hover:text-yellow-900">Edit Profile</a>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Role Section */}
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-3">
                      1. Select a Role <span className="text-red-500">*</span>
                    </p>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {roles.length > 0 ? roles.map((role) => (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRole(role.name)}
                          className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center justify-between group
                                                        ${selectedRole === role.name
                              ? 'border-[#c5050c] bg-[#c5050c]/5 ring-1 ring-[#c5050c]'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }
                                                    `}
                        >
                          <div>
                            <h4 className={`font-bold text-sm ${selectedRole === role.name ? 'text-[#c5050c]' : 'text-slate-800'}`}>
                              {role.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {role.skills.length > 0 ? role.skills.join(" • ") : "General Support"}
                            </p>
                          </div>
                          {selectedRole === role.name && (
                            <CheckCircleIcon className="w-5 h-5 text-[#c5050c]" />
                          )}
                        </div>
                      )) : (
                        <div
                          onClick={() => setSelectedRole("General Member")}
                          className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center justify-between
                                                        ${selectedRole === "General Member"
                              ? 'border-[#c5050c] bg-[#c5050c]/5 ring-1 ring-[#c5050c]'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }
                                                    `}
                        >
                          <div>
                            <h4 className={`font-bold text-sm ${selectedRole === "General Member" ? 'text-[#c5050c]' : 'text-slate-800'}`}>
                              General Member
                            </h4>
                          </div>
                          {selectedRole === "General Member" && (
                            <CheckCircleIcon className="w-5 h-5 text-[#c5050c]" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screening Questions Section */}
                  {screeningQuestions.length > 0 && (
                    <div className="animate-fadeIn">
                      <p className="text-sm font-bold text-slate-700 mb-3">
                        2. Screening Questions <span className="text-red-500">*</span>
                      </p>
                      <div className="space-y-4">
                        {screeningQuestions.map((q, idx) => (
                          <div key={idx}>
                            <label className="block text-xs font-bold text-slate-600 mb-1">{q}</label>
                            <textarea
                              rows={2}
                              className="w-full rounded-lg border-slate-200 focus:border-[#c5050c] focus:ring-[#c5050c] text-sm p-3 bg-slate-50 focus:bg-white transition-colors"
                              placeholder="Type your answer here..."
                              value={answers[q] || ""}
                              onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 justify-center rounded-xl border border-transparent bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`flex-1 justify-center rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition
                                            ${selectedRole
                        ? 'bg-[#c5050c] hover:bg-red-700 focus:ring-red-500'
                        : 'bg-slate-300 cursor-not-allowed'
                      }
                                        `}
                    onClick={handleSubmit}
                    disabled={!selectedRole}
                  >
                    Submit Application
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
