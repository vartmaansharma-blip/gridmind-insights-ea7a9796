import { PublicSite } from "@/components/public-site/site";

/* Review wrapper: the same public site as /website, with an internal banner. */
export function DesignPreview() {
  return (
    <>
      <div className="fixed bottom-3 left-1/2 z-[80] -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg" style={{ background: "#9ADD00", color: "#080D08" }}>
        Internal review copy of /website · fictional example data
      </div>
      <PublicSite />
    </>
  );
}
