# Deploying to Vercel

Follow these steps to deploy your application to Vercel:

## 1. Push your code to GitHub

If you haven't already, push your code to GitHub:

```bash
# If you haven't set up a remote yet
git remote add origin https://github.com/YOUR_USERNAME/inv-app-web.git

# Add all changes
git add .

# Commit changes
git commit -m "Fix build issues and prepare for deployment"

# Push to GitHub
git push -u origin main
```

## 2. Sign up for Vercel

1. Go to [Vercel](https://vercel.com/) and sign up for an account
2. You can sign up using your GitHub account for easier integration

## 3. Import your GitHub repository

1. In the Vercel dashboard, click "Add New..." > "Project"
2. Connect to your GitHub account if you haven't already
3. Select the repository you just pushed to
4. Vercel will automatically detect that it's a Next.js project

## 4. Configure your project

1. Set up your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
2. Keep the default build settings (Vercel will detect Next.js automatically)
3. Click "Deploy"

## 5. Wait for deployment

Vercel will build and deploy your application. Once complete, you'll get a URL where your application is live.

## 6. Set up a custom domain (optional)

1. In your project settings on Vercel, go to "Domains"
2. Add your custom domain and follow the instructions to set up DNS

## 7. Continuous Deployment

Any future changes you push to your GitHub repository will automatically trigger a new deployment on Vercel.
