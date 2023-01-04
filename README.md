*Allows tracking shared Notion page views. View count will only display in the shared page accessed by a shared link, not through your Notion app*
https://youtu.be/0Ko6VJ2r8ns

# Local development
1. `serverless login`
2. `npm run dynamodb_install_local`
3. `serverless plugin install -n serverless-dynamodb-local`
4. Install aws cli
5. `aws configure` (Use credentials created from user in IAM)
6. `npm run start_local`
7. There's no 7-th step. System will create a user and request credentials automatically.

# Usage
Add an embedded block to Notion. Use the lambda public URL. Url format is: `https://<lambda_url>/<page_id>?size=60&family=monospace&text=Views`

Parameters info:
1. page_id (string) - Page id unique for your Notion workspace. You can come up with your own page id, it has to be any random string
2. size (number) - Font size
3. family (string) - Font Family
4. text (string) - Text shown before the view count. Don't forget to urlencode it
