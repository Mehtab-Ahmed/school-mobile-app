import api from './axios';

export const libraryApi = {
  books: (search?: string) =>
    api.get('/library/books', { params: search ? { search } : {} }).then(r => {
      const d = r.data;
      if (d?.data?.content) return { ...d, data: d.data.content };
      if (d?.content) return { data: d.content, success: true };
      return d;
    }),

  /** Books issued to the signed-in user, current and past. */
  myIssued: () =>
    api.get('/library/issues/my').then(r => ({
      ...r.data,
      data: (r.data?.data ?? []).map((i: any) => ({
        id: i.id,
        book: i.book,
        issuedAt: i.issueDate,
        dueDate: i.dueDate,
        returnedAt: i.returnDate ?? undefined,
        status: i.status,
        finePaid: i.finePaid,
      })),
    })),

  issueBook: (bookId: number, studentId: number, dueDays: number) =>
    api.post('/library/issue', { bookId, studentId, dueDays }).then(r => r.data),

  returnBook: (issueId: number) =>
    api.post(`/library/return/${issueId}`).then(r => r.data),
};
