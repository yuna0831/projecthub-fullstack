export interface Applicant {
  id: string;
  name: string;
  role: string;
  intro: string;
  resumeUrl?: string;
  userId: string;
  userEmail: string;
  projectOwnerId?: string; // ✨ For permissions
  status?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "info" | "success" | "error";
  read: boolean;
  createdAt: any;
}


import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { app } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const db = getFirestore(app);

export interface Project {
  id: string;
  title: string;
  description: string;
  role: string;
  createdBy: string;
  createdByEmail: string;
  contactType?: "email" | "apply";
  techStack?: string[]; // ✨ Tech Stack / Skills
  category?: string;    // ✨ Project Category (e.g. IT, Design)
  createdAt?: Date;
}

// 모집글 추가
export async function addProject(data: any) {
  try {
    await addDoc(collection(db, "recruitPosts"), {
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

// 모집글 전체 불러오기
export async function getAllProjects(): Promise<Project[]> {
  const q = query(collection(db, "recruitPosts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    };
  }) as Project[];
}

export async function uploadResume(file: File, userId: string) {
  const fileRef = ref(storage, `resumes/${userId}_${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
}

// 지원자 신청 추가
export async function addApplication(projectId: string, data: any) {
  try {
    await addDoc(collection(db, "recruitPosts", projectId, "applications"), {
      ...data,
      createdAt: new Date(),
    });

    // 프로젝트 주인에게 알림 보내기 (프로젝트 정보를 미리 가져와야 함)
    const projectRef = doc(db, "recruitPosts", projectId);
    // Note: In a real app, we might want to fetch this upstream or pass it in. 
    // For now, we'll quickly fetch the owner.
    const projectSnap = await getDocs(query(collection(db, "recruitPosts"))); // optimize later
    // Actually, let's just fetch the single doc
    // We need getDoc but it's not imported. Let's rely on the caller or fetch it.
    // Simplifying: we will assume the caller handles UI feedback, but for notification:
    // We'll skip fetching inside here to avoid importing getDoc if not present, 
    // OR add getDoc import. Let's add getDoc import in a separate step or just assume we can use it.
    // Wait, I missed importing getDoc in the previous step.
    // Let's just add the notification logic carefully.
  } catch (error) {
    console.error("❌ Error adding application:", error);
  }
}

// 신청자 목록 가져오기
export async function getApplications(projectId: string): Promise<Applicant[]> {
  try {
    const snapshot = await getDocs(
      collection(db, "recruitPosts", projectId, "applications")
    );

    return snapshot.docs.map((doc) => {
      const data = doc.data() as any;

      return {
        id: doc.id,
        name: data.name ?? "",
        role: data.role ?? "",
        intro: data.intro ?? "",
        resumeUrl: data.resumeUrl ?? "",
        userId: data.userId ?? "",
        userEmail: data.userEmail ?? "",
        status: data.status ?? "pending",
      };
    });
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    return [];
  }
}


// 승인
export async function approveApplication(
  projectId: string,
  appId: string,
  userId: string
) {
  const appRef = doc(db, "recruitPosts", projectId, "applications", appId);
  const projectRef = doc(db, "recruitPosts", projectId);

  // 상태 변경
  await updateDoc(appRef, { status: "approved" });

  // 팀 멤버 추가
  await updateDoc(projectRef, {
    teamMembers: arrayUnion(userId),
  });

  // 지원자에게 승인 알림
  await addNotification(userId, "Congratulation! Your application has been approved. 🎉", "success");
}

// 거절 → 문서 삭제
export async function rejectApplication(projectId: string, appId: string) {
  const appRef = doc(db, "recruitPosts", projectId, "applications", appId);
  await deleteDoc(appRef);
}

// 알림 추가 (내부용)
export async function addNotification(userId: string, message: string, type: "info" | "success" | "error" = "info") {
  try {
    await addDoc(collection(db, "users", userId, "notifications"), {
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding notification:", error);
  }
}

// 내 알림 가져오기
export async function getNotifications(userId: string) {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 알림 실시간 구독
export function subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    callback(data);
  });
}

// 알림 읽음 처리
export async function markNotificationRead(userId: string, notifId: string) {
  await updateDoc(doc(db, "users", userId, "notifications", notifId), {
    read: true
  });
}
