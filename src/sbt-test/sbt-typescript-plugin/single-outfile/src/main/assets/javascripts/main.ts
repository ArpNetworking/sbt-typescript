import {upperCase} from './util/string'; // TS file in another folder (testing source maps)
import {log} from './util/logger'; // Legacy JS file

// Legacy is a "global" object which typescript will complain about without the typings file
log(Legacy.someFunc(upperCase("Hello World")));
