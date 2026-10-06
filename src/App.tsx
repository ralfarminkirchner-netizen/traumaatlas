import { Suspense, lazy } from "react";
import { isSceneView, useAtlasState, type ViewId } from "@/state/atlas-store";
import AkutBar from "@/components/AkutBar";
import AtlasNav from "@/components/AtlasNav";
import StartHero from "@/views/start/StartHero";
import KoerperOverlay from "@/views/koerper/KoerperOverlay";
import KaskadeView from "@/views/kaskade/KaskadeView";
import PolyvagalView from "@/views/polyvagal/PolyvagalView";
import ToleranzView from "@/views/toleranz/ToleranzView";
import NavigatorView from "@/views/navigator/NavigatorView";
import LexikonView from "@/views/lexikon/LexikonView";
import StammbaumView from "@/views/stammbaum/StammbaumView";
import BaukastenView from "@/views/baukasten/BaukastenView";
import WechselView from "@/views/wechsel/WechselView";
import WegweiserView from "@/views/wegweiser/WegweiserView";

// 3D-Szene lazy laden (Performance: initialer Bundle klein halten)
const BodyScene = lazy(() => import("@/scene/BodyScene"));

/** Overlay-Inhalte, die über der persistenten 3D-Szene schweben. */
const SCENE_OVERLAYS: Partial<Record<ViewId, React.ComponentType>> = {
  start: StartHero,
  koerper: KoerperOverlay,
  kaskade: KaskadeView,
  polyvagal: PolyvagalView,
  toleranz: ToleranzView,
  navigator: NavigatorView,
};

/** Vollseiten-Views ohne 3D-Szene. */
const PAGE_VIEWS: Partial<Record<ViewId, React.ComponentType>> = {
  lexikon: LexikonView,
  stammbaum: StammbaumView,
  baukasten: BaukastenView,
  wechsel: WechselView,
  wegweiser: WegweiserView,
};

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-abyss/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-[12px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-display text-sm text-ink">
          TRAUMA<span className="text-amber">ATLAS</span>
        </p>
        <p>
          Ein Orientierungsangebot – keine Diagnose, keine Therapie. Bei Akutlage:
          Telefonseelsorge 0800 111 0 111 (24 h, kostenfrei), Notfall 112.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const { view } = useAtlasState();
  const scene = isSceneView(view);
  const Overlay = SCENE_OVERLAYS[view];
  const Page = PAGE_VIEWS[view];

  return (
    <div className="flex min-h-dvh flex-col bg-abyss text-ink">
      <AkutBar />
      <AtlasNav />

      <main className="relative flex-1">
        {scene ? (
          <div className="absolute inset-0 min-h-0">
            {/* Persistente 3D-Bühne */}
            <div className="absolute inset-0">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="glass rounded-2xl px-5 py-3 text-sm text-muted-foreground">
                      Szene lädt …
                    </div>
                  </div>
                }
              >
                <BodyScene />
              </Suspense>
            </div>
            {/* Overlay-Schicht */}
            {Overlay && (
              <div
                key={view}
                className="view-fade absolute inset-0 overflow-y-auto scrollbar-thin"
              >
                <div className="flex min-h-full flex-col">
                  <Overlay />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div key={view} className="view-fade mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
            {Page ? <Page /> : null}
            <Footer />
          </div>
        )}
      </main>
    </div>
  );
}
