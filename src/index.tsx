import { History, createBrowserHistory } from 'history';
import React,{
    Children,
    PropsWithChildren,
    ReactNode,
    cloneElement,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { URLPattern } from 'urlpattern-polyfill';

export const BrowserRouterContext = createContext<{
    currentChild: ReactNode | Element;
    setCurrentChild: (child: ReactNode | Element) => void;
    history: History;
}>(null);

export const BrowserRouter = (props: PropsWithChildren) => {
    const [currentChild, setCurrentChild] = useState(null);
    const history = createBrowserHistory();
    const baseURL = window.location.protocol + '//' + window.location.host;

    history.listen((newLocation) => {
        const children = Children.toArray(props.children);
        const location = `${baseURL}${newLocation.location.pathname}`;
        Children.forEach(children, (child: any) => {
            const pattern = new URLPattern(child.props.path, baseURL);
            const compiled = pattern.exec(location);
            if (compiled) {
                const clone = cloneElement(child);
                setCurrentChild(clone);
            }
        });
    });

    useEffect(() => {
        history.push(window.location.pathname);
    }, []);

    return (
        <BrowserRouterContext.Provider
            value={{ currentChild, setCurrentChild, history }}
        >
            {currentChild?.props.element}
        </BrowserRouterContext.Provider>
    );
};

export const useNavigate = () => {
    const history = useHistory();
    return (url: string) => {
        history.replace(url);
    };
};

export const NavLink = (
    props: PropsWithChildren & { to: string; className?: string, exact?: boolean },
) => {
    const navigate = useNavigate();
    const onNavigate = useCallback(
        (event: any) => {
            event.stopPropagation();
            event.preventDefault();
            navigate(event.currentTarget.href);
        },
        [],
    );

    const active = () => {
        if( props.exact ) {
            return window.location.pathname === props.to ? ' active' : '';
        }

        return window.location.pathname === props.to ||
        window.location.pathname.startsWith(props.to)? ' active' : '';
    }

    return (
        <a
            className={`${props.className} ${active()}`}
            href={props.to}
            onClick={(e) => onNavigate(e)}
        >
            {props.children}
        </a>
    );
};

export const useRouter = () => {
    return useContext(BrowserRouterContext);
};

export const useHistory = () => {
    return useRouter().history;
};

export const Route = (_props: {
    path: string;
    element: ReactNode | Element;
}) => {
    return null;
};
