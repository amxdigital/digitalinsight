import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

/* Argon-ui theme css */
import "@argon-ui/assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@argon-ui/assets/scss/argon-dashboard-react.scss";

/* App css */
import "./styles/index.scss";

import { store } from "./store";
import Routes from "./routes";
import { ErrorBoundary, GlobalModal, ToastUtil } from "./modules/utils";

__webpack_public_path__ = window.CONST?.remoteJsUrl
    ? `${window.CONST?.remoteJsUrl}/dist/`
    : window.location.href.indexOf("github.io") > -1
    ? `https://cherrybase.github.io/cherry-insights/`
    : window.location.href.indexOf(".pages.dev") > -1
    ? "https://digitalinsight.pages.dev/"
    : `"https://localhost:3000/dist/`;

const Root = () => (
    <Provider store={store}>
        <BrowserRouter {...(window.location.href.indexOf("github.io") > -1 ? { basename: "/cherry-insights" } : {})}>
            {" "}
            {/* https://github.com/facebook/create-react-app/issues/1765 */}
            <ErrorBoundary>
                <div className="app">
                    <Routes />
                    <GlobalModal />
                    <ToastUtil />
                </div>
            </ErrorBoundary>
        </BrowserRouter>
    </Provider>
);

render(<Root />, document.getElementById("app"));

if (module["hot"]) {
    module["hot"].accept();
}
