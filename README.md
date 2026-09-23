ProcureAI’s Next.js frontend. Authentication is cookie-based and powered by RTK Query.

## Getting Started

Copy `.env.example` to `.env.local` if the API is not at `http://localhost:3000`, then run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Run the Nest backend on port 5000 (for example, `PORT=5000 npm run start:dev`) so the frontend’s `/api` proxy does not point back to itself.

Set `NEXT_PUBLIC_API_URL` to the backend origin (for example, `http://localhost:5000`). Requests go directly from the browser to the backend with `credentials: "include"`; no token is placed in local storage or exposed to client-side JavaScript. On a 401 from a protected query, the shared base query calls `/auth/refresh` once and retries the original request. The backend must allow the frontend origin through credentialed CORS.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
