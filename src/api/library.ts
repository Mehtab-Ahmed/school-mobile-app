import api from './axios';

export const libraryApi = {
  books: (search?: string) =>
    api.get('/library/books', { params: search ? { search } : {} }).then(r => {
      const d = r.data;
      if (d?.data?.content) return { ...d, data: d.data.content };
      if (d?.content) return { data: d.content, success: true };
      return d;
    }),
  myIssued: () => api.get('/library/issues/my').then(r => r.data),
  issueBook: (bookId: number, studentId: number, dueDays: number) =>
    api.post('/library/issue', { bookId, studentId, dueDays }).then(r => r.data),
  returnBook: (issueId: number) =>
    api.post(`/library/return/${issueId}`).then(r => r.data),
};
