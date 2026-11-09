<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Keep the station detail page at `/stations/$stationId` as a top-level route because both admin and officer workspaces link to the same station profile.

Keep reusable directory, contract, audit, catalogue and report screens together in the shared reference-pages module because these views reuse common sample data across role workspaces.
