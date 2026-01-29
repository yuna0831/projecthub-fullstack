"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roleName: string) => void;
  roles: { id: string; name: string; count: number; skills: string[] }[];
  projectTitle: string;
}

export default function ApplyModal({ isOpen, onClose, onConfirm, roles, projectTitle }: ApplyModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedRole) {
      onConfirm(selectedRole);
      setSelectedRole(null);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 leading-tight">
                    Apply to <span className="text-[#c5050c]">{projectTitle}</span>
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-slate-500 mb-4">
                    Which role are you interested in?
                  </p>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {roles.length > 0 ? roles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRole(role.name)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all flex items-center justify-between group
                                                    ${selectedRole === role.name
                            ? 'border-[#c5050c] bg-[#c5050c]/5 ring-1 ring-[#c5050c]'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }
                                                `}
                      >
                        <div>
                          <h4 className={`font-bold ${selectedRole === role.name ? 'text-[#c5050c]' : 'text-slate-800'}`}>
                            {role.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {role.skills.length > 0 ? role.skills.join(" • ") : "General Support"}
                          </p>
                        </div>
                        {selectedRole === role.name && (
                          <CheckCircleIcon className="w-6 h-6 text-[#c5050c]" />
                        )}
                      </div>
                    )) : (
                      <div
                        onClick={() => setSelectedRole("General Member")}
                        className={`cursor-pointer rounded-xl p-4 border transition-all flex items-center justify-between
                                                    ${selectedRole === "General Member"
                            ? 'border-[#c5050c] bg-[#c5050c]/5 ring-1 ring-[#c5050c]'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }
                                                `}
                      >
                        <div>
                          <h4 className={`font-bold ${selectedRole === "General Member" ? 'text-[#c5050c]' : 'text-slate-800'}`}>
                            General Member
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Looking for teammates
                          </p>
                        </div>
                        {selectedRole === "General Member" && (
                          <CheckCircleIcon className="w-6 h-6 text-[#c5050c]" />
                        )}
                      </div>
                    )}
                  </div>
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
                    Confirm
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
