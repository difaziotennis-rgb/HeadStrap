import { bookingProId } from "./lesson-slots";
import { KEYS, loadList, saveList, type S27LessonBooking } from "./storage";

export const PRO_CLIENTS_KEY = "s27_pro_clients_v1";

export type S27ProClient = {
  id: string;
  proId: string;
  memberNumber?: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

function clientKey(person: { memberNumber?: string; email?: string; name: string }) {
  if (person.memberNumber) return `m:${person.memberNumber}`;
  const email = (person.email || "").trim().toLowerCase();
  if (email) return `e:${email}`;
  return `n:${person.name.trim().toLowerCase()}`;
}

export function loadProClients(): S27ProClient[] {
  return loadList<S27ProClient>(PRO_CLIENTS_KEY);
}

export function saveProClients(list: S27ProClient[]) {
  saveList(PRO_CLIENTS_KEY, list);
}

export function rememberProClient(
  proId: string,
  person: { memberNumber?: string; name: string; email?: string; phone?: string }
) {
  const name = (person.name || "").trim();
  if (!proId || !name) return;
  const email = (person.email || "").trim();
  const phone = (person.phone || "").trim();
  const now = new Date().toISOString();
  const all = loadProClients();
  const emailLc = email.toLowerCase();
  const idx = all.findIndex((c) => {
    if (c.proId !== proId) return false;
    if (person.memberNumber && c.memberNumber === person.memberNumber) return true;
    if (emailLc && c.email.trim().toLowerCase() === emailLc) return true;
    if (!person.memberNumber && !emailLc && c.name.trim().toLowerCase() === name.toLowerCase()) return true;
    return false;
  });
  if (idx >= 0) {
    const prev = all[idx];
    all[idx] = {
      ...prev,
      memberNumber: person.memberNumber || prev.memberNumber,
      name,
      email: email || prev.email,
      phone: phone || prev.phone,
      updatedAt: now,
    };
  } else {
    all.push({
      id: `pclient-${proId}-${clientKey({ ...person, name })}`,
      proId,
      memberNumber: person.memberNumber,
      name,
      email,
      phone,
      createdAt: now,
      updatedAt: now,
    });
  }
  saveProClients(all);
}

export function rememberProClientFromLesson(lesson: S27LessonBooking) {
  if (lesson.requestStatus === "declined") return;
  rememberProClient(bookingProId(lesson), {
    memberNumber: lesson.memberNumber,
    name: lesson.clientName,
    email: lesson.clientEmail,
    phone: lesson.clientPhone,
  });
}

/** Write lessons and upsert each non-declined player onto that pro’s client list. */
export function persistLessons(list: S27LessonBooking[]) {
  saveList(KEYS.lessons, list);
  for (const lesson of list) rememberProClientFromLesson(lesson);
}

export function clientsForPro(proId: string) {
  return loadProClients()
    .filter((c) => c.proId === proId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
