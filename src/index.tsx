import React from "react"
import {BrowserHistory, createBrowserHistory} from "history";
import {PropsWithChildren, createContext} from "preact/compat";
import {useContext, useEffect, useState} from "preact/compat";
import classnames from "classnames";
import {URLPattern} from "urlpattern-polyfill";

type KeyValueMap = {
    [key: string]: string;
}
export const RouterContext = createContext<{
    history: BrowserHistory,
    params: KeyValueMap,
    setParams: (p: KeyValueMap) => void
}>(null);
export const useRouter = () => {
    return useContext(RouterContext);
}
export const useHistory = () => {
    const r = useRouter();
    return r.history;
}
export const useNavigate = () => {
    const h = useHistory();
    return (url: string) => {
        h.replace(url);
    }
}
export const useParams = () => {
    const r = useRouter();
    return r.params;
}
const RouteProvider = (props: PropsWithChildren) => {
    const [currentChild, setCurrentChild] = useState(null);
    const r = useRouter();

    const updateView = () => {
        if( props.children && props.children !== currentChild ) {
            const baseURL = window.location.protocol.concat('//').concat(window.location.host);
            const location = window.location.href;
            for(const child of props.children as Array<any>) {
                const pattern = new URLPattern({pathname: child.props.path, baseURL});
                const compiled = pattern.exec(location)
                if( compiled ) {
                    if( child !== currentChild ) {
                        r.setParams(compiled.pathname.groups);
                        setCurrentChild(child);
                        break;
                    }
                }
            }
        }
    }

    r.history.listen(()=> {
        updateView();
    })

    useEffect(() => {
        updateView();
    }, [window.location.href]);

    return <>
        {
            currentChild
        }
    </>
}
export const Router = (props: any) => {
    const history = createBrowserHistory();
    const [params, setParams] = useState({})
    return <RouterContext.Provider value={{history, params, setParams}}>
        <RouteProvider>
            {props.children}
        </RouteProvider>
    </RouterContext.Provider>
}
export const Link = (props: any) => {
    let className = classnames(props.className as string);
    const location = window.location.pathname;
    const navigate = useNavigate();

    if (location === props.href || location.startsWith(props.href as string)) {
        className = classnames(className, props.activeClassName);
    }

    return (
        <a
            href={props.href}
            className={className}
            onClick={(evt) => {
                evt.stopPropagation();
                evt.preventDefault();
                navigate(props.href as string);
            }}
        >
            {props.children}
        </a>
    );
};
