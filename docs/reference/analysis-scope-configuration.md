Changing the analysis scope configuration
=========================================

You can change Sigrid's configuration for your project, to make Sigrid's feedback as useful and actionable as possible. We call this configuration "the scope".

By default, Sigrid will try to automatically detect the technologies you use, the component structure, and files/directories that should be excluded from the analysis. However, you can override this standard configuration with your project-specific configuration. To do this, create a file called `sigrid.yaml` and add it to the root of your repository. When you merge changes to `sigrid.yaml`, Sigrid will pick up the new configuration and apply it to subsequent scans.

<iframe width="560" height="315" src="https://www.youtube.com/embed/Uomc7hUbRTw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

The following example shows a typical example of the `sigrid.yaml` configuration file:

    component_depth: 1
    exclude:
      - ".*/simulator/.*"
    languages:
      - name: java
      - name: python
      - name: typescript
      
The various options and sections are explained in more detail in the remainder of this page.

## Editing scope files

Since scope files are part of your repository, you can edit them using your preferred text editor. Sigrid scope configuration files are registered with [SchemaStore.org](https://schemastore.org), which means you get IDE features like content assist and error detection while you're editing the file. 

- In [Visual Studio Code](https://code.visualstudio.com), support is automatically provided if you are using the recommended file name of `sigrid.yaml`. If you are using a different file name, you can select the Sigrid JSON schema manually using the *"select JSON schema"* option located in the bottom right of the editor window.
- In [JetBrains IDEs](https://www.jetbrains.com), which include IntelliJ IDEA, WebStorm, and PyCharm, you can get editor support by selecting *Sigrid scope configuration file* in the bottom right of the editor window. After you have done this the first time, the IDE will automatically provide editor support when you open other `sigrid.yaml` files in the future.

<img src="../images/scope-file-ide.png" width="400" />

### Excluding files and directories

Sigrid will exclude common patterns by default. For example, directories like `build`, `dist`, and `target` typically contain build output and are not part of the source code. Directories like `node_modules` contain open source libraries and are not part of the application's own source code. Those directories are therefore ignored during the analysis.

It is possible to extend this list with project-specific files and directories that should also be excluded. The `exclude` section in the YAML file contains a list of regular expressions for paths to ignore. For example, `.*[.]out[.]js` will exclude all files with a name ending in `.out.js` from the analysis. Adding `.*/simulator/.*` will exclude everything in a path that contains the directory `/simulator/`.

Note that it is not necessary to exclude files and directories that would not be analyzed anyway. 

Patterns are defined using regular expressions, as explained in the next section.

### Defining include and exclude patterns

Various options across the scope configuration file allow you to define `include` and `exclude` patterns. At first glance, many people expect these patterns to behave like [Glob patterns](https://en.wikipedia.org/wiki/Glob_(programming) (for example `*.py`), but Sigrid actually uses [regular expressions](https://en.wikipedia.org/wiki/Regular_expression) instead. The reason for this is fairly straightforward: regular expressions are more flexible, which is relevant considering the large number of technologies and conventions that Sigrid needs to support.

The following example specifies a component that includes all `.js` and `.jsx` files with a path that includes the `frontend` directory, except files ending with `.spec.jsx`:

    components:
      - name: "Our new React website"
        include:
          - ".*/frontend/.*[.]jsx?"
        exclude:
          - ".*[.]spec[.]jsx?" #excluding all spec.js files, wherever they are; alternatively, limiting to files within a `/frontend/` directory tree, `.*/frontend/.*[.]spec[.]js`
          
When you specify both `include` and `exclude` patterns, the exclude patterns take precedence. In this example, the file `frontend/home.jsx` would be included, but the file `frontend/example.spec.jsx` would be excluded. This is much easier and maintainable than trying `.*(?<![.]spec)[.]jsx?` under `include`, even though that would work.

As a convention, all `include` and `exclude` patterns always start with `.*/`. It is tempting to always define patterns relative to the root of the codebase, but it is important to realize that what is considered the "root" is flexible in Sigrid. Depending on how you [map your repositories to systems](../organization-integration/systems.md), the root of your repository might not match the root of the Sigrid system that contains your repository. Starting all patterns `.*/` will avoid confusion in such situations.

### Other common tips and caveats when using regular expressions to define patterns

- The full file path must always be matched instead of (part of) a filename. This generally requires some wildcards.
- All patterns are case-sensitive. This is relevant in case you are specifically searching for naming in camelCase or PascalCase. It is then useful to search for files like `SomeTest.java`.
- You are entering patterns inside of a YAML file. YAML uses backslashes for escape characters. So if you want to use backslashes inside of your regular expressions, for example `\S+` (i.e. "one or more non-whitespace characters"), you will need to escape the backslash: `\\S+`.
- If you want to express a literal dot `.`, use `[.]`. This means: 1 character in a group where only `.` is permitted.
- Since the commonly used `.*` is greedy, with deep directory structures it may happen that directory names appear in other places than you want. Or that you are looking for specific file names, and those words should not appear in directory names. To find filenames specifically, or whenever you want to avoid a deeper level directory, a useful pattern is `[^/]*` or `[^/]+`. This pattern consumes characters as long as it does not find a `/`. When used as `/[^/]*[.]java` it will ensure to catch a filename ending with `.java`. You could only have defined a character set, like `.*/[\\w-][.]java` but this is prone to omissions.  
- Matching "positive" patterns, including the `exclude` option, is far easier than trying with negative lookaheads `(?!)`, because catching the full file path becomes difficult. There are cases where patterns may work such as `((?![unwanted string]).)+`, but these cases are hard to get right or debug. Also, negative lookbehinds (`?<!`) are not recommended. They pattern to be matched requires a fixed length and it needs to immediately precede the rest of the pattern to work (wildcards tend to break here). In both cases, using the `exclude` option has preference. 

## Technology support

The `languages` section lists all languages that you want Sigrid to analyze:

    languages:
      - name: Csharp
      - name: Java
      - name: Python
      - name: Typescript

Refer to the [list of supported technologies](technology-support.md) for an overview of all supported technologies and the names that can be used.

## Overriding automatic technology and test code detection

When you add a technology to your scope file, Sigrid will try to locate the corresponding files based on file and directory name conventions. This includes automatic detection of test code. For example, Java-based projects typically use `src/main/java` for production code and `src/test/java` for test code.

This automatic detection is usually sufficient for the majority of projects. However, if you are using less common frameworks or a custom naming convention, you will need to tell Sigrid where it can find the test code. Like other parts of the scope file, this is done using regular expressions:

    languages:
      - name: Java
        production:
        test:
          include:
            - ".*/our-smoke-tests/.*[.]java"

This example will classify all Java code in the `our-smoke-tests` directory as test code.

## Defining components

Component detection is based on the project's directory structure. What "components" mean depends on the technology. In Java, components are usually based on Maven modules. In C, components are often simply the project's top-level directories.

Components can be defined in several ways, which are explained below.

**Option 1: Defining components based on directory depth**

The simple option is to simply base the components on directory depth. The following example will use the project's top-level directories as components.

    component_depth: 1
    
**Option 2: Defining components based on base directories**

In some projects, using directory depth will not accurately reflect the actual component structure. The more advanced options allows you to define components explicitly:

    component_base_dirs:
      - "modules"
      - "modules/specific"
      - "" # This includes the root directory as a separate component
      
**Option 3: Defining components manually**

In some cases the components really do not match the directory structure, and the only way to define components is by manually listing what should go where. In the example below, regular expressions are used to define what files and directories belong to each component. The syntax is identical to the patterns used in the `exclude` section. These `include` and `exclude` patterns work as explained in the [patterns section](#defining-include-and-exclude-patterns).

    components:
      - name: "Back-end"
        include:
          - ".*[.]java"
      - name: "Log"
        include:
          - ".*/cs/findbugs/log/.*"
          
In general you should try to avoid defining components in this way: not because it is not possible, but because it is hard to maintain. This might work perfectly well for your system's *current* codebase, but what's going to happen when someone moves a file or adds a directory? This type of component configuration will require constant maintenance.

## Open Source Health

**Note: This requires a [Sigrid license for Open Source Health](https://www.softwareimprovementgroup.com/capabilities/sigrid-open-source-health/). Without this license, you will not be able to see security results in Sigrid.**

Open Source Health allows you to scan all open sources libraries used by your system, and identify risks such as security vulnerabilities or heavily outdated libraries.

    dependencychecker:
      enabled: true
      blocklist: []
      transitive: false
      exclude:
        - ".*/scripts/.*"
        
The `dependencychecker` section supports the following options:

| Option name  | Required? | Description                                                                                    |
|--------------|-----------|------------------------------------------------------------------------------------------------|
| `enabled`    | Yes       | Set to `true` to enable Open Source Health analysis.                                           |
| `blocklist`  | Yes       | List of library names that should not be scanned. Typically used to ignore internal libraries. |
| `transitive` | No        | When true, also scans the dependencies of your dependencies. Defaults to false.                |
| `exclude`    | No        | List of file/directory patterns that should be excluded from the Open Source Health analysis.  |

Please Note: dependency exclusions may be necessary in case your system resolves internal dependencies that could expose organization- or system name based on their internal URI. Therefore, as part of the onboarding process, please inform SIG of any such naming conventions that should be filtered. [See also this question in the FAQ on dependency filtering](../capabilities/faq-security.md#does-sig-filter-when-resolving-our-systems-dependencies).

## Security

**Note: This requires a [Sigrid license for Software Security](https://www.softwareimprovementgroup.com/solutions/sigrid-software-security/). Without this license, you will not be able to see security results in Sigrid.**

Sigrid uses a combination of its own security checks and security checks performed by third party tools. It then combines the results, benchmarks them, and reports on the overall results.

    thirdpartyfindings:
      enabled: true
      exclude:
        - ".*/scripts/.*[.]sh"
          
The `thirdpartyfindings` section supports the following options:

| Option name | Required? | Description                                                                         |
|-------------|-----------|-------------------------------------------------------------------------------------|
| `enabled`   | Yes       | Set to `true` to enable security analysis.                                          |
| `exclude`   | No        | List of file/directory patterns that should be excluded from the security analysis. |

## Architecture Quality

**Note: This requires an Architecture Quality license, which is currently restricted to a limited customer beta. Without this license, you will not be able to see security results in Sigrid.**

Similar to other Sigrid capabilities, you can enabled the Architecture Quality capability by adding a section to your configuration file:

    architecture:
      enabled: true
      
Adding this section to the configuration will automatically enable the Architecture Quality analysis every time you publish your system to Sigrid.

### Components in Maintainability versus components in Architecture Quality

Sigrid combines different capabilities, and those different capabilities might necessitate their own view on your system. In Sigrid's *Maintainability* pages, you get a simple breakdown into one level of components. Because you only get a single level, you need to define these components manually as explained in the [defining components](#defining-components) section.

Out of the box, Sigrid's *Architecture Quality* provides a different componentization, which allows for more detail: components can have sub-components, those can *also* have sub-components, and so on. Having multiple levels of sub-components is necessary to make Architecture Quality useful. In many cases, there is general consensus on the top-level architecture. It's the internal architecture within sub-components where things get interesting. Generally, those internal architectures are the responsibility of a team, and therefore less known to people outside of the team (and in many cases it's even not fully transparent to the team itself). Moreover, incrementally improving the top-level architecture is very hard. Focusing on architecture improvement/modernization is easier when starting with a component's internal architecture, as there are less people involved and it's therefore more realistic to realize improvements within a sprint. 

The fact that Architecture Quality relies on these sub-components also explains the second difference with the components you see in the maintainability page: For Architecture Quality, components and sub-components are detected automatically. This is required to make them useful and practical: defining components manually just isn't practical if your system has 50 microservices, each with their own internal architecture. Configuring such a system manually would be a huge amount of work. And you would need to update the configuration every time you add a microservice or change its internal architecture!

The obvious downside of this approach is that it leads to different views in Sigrid's Maintainability and Architecture Quality pages. However, having [multiple architecture views](https://en.wikipedia.org/wiki/4%2B1_architectural_view_model) is fairly mainstream, hence we adopted this approach by Sigrid.

However, if it is essential for you to have the same componentization for both Maintainability and Architecture Quality, or if you really want to define your Architecture Quality view manually, it is possible to override the standard behavior in the configuration:

    architecture:
      enabled: true
      custom_components: true
      
This will disable the automatic component detection for Architecture Quality, and will instead use the [components you defined manually](#defining-components).
      
### Analyzing your repository history
      
Architecture Quality also requires the repository history to be included in the upload. This requires the `--include-history` option to be enabled in the [Sigrid CI client script](client-script-usage.md). See the [frequently asked questions for architecture quality](../capabilities/faq-architecture.md) for more information on how the repository history is analyzed.

When you publish your repository history to Sigrid, it is automatically picked up by the Architecture Quality analysis without needing further configuration. By default, Sigrid will analyze the repository history for the last year. If you want to change this to a different period, you can manually specify the time period that should be analyzed:

    architecture:
      enabled: true
      history_period_months: 6
      
This example will change the default period of 12 months, and instead analyze only analyze the last 6 months of history. If you want to go even further, it is also possible to define an exact start date:

    architecture:
      enabled: true
      history_start: "2023-01-01"
      
### Manually specifying architecture dependencies

Although Sigrid supports hundreds of technologies, there is always the possibility that Sigrid doesn't automatically detect the dependencies for your particular framework. It is therefore possible to manually define additional dependencies, which will be added on top of the automatic dependency detection:

    architecture:
      enabled: true
      add_dependencies:
        - source: backend
          target: frontend
            
The names for the `source` and `target` fields are the same you see in Sigrid's user interface. You can use the same mechanism to remove false positives from the automatic dependency detection:

    architecture:
      enabled: true
      remove_dependencies:
        - source: frontend
          target: backend
          
### Excluding files and directories for Architecture Quality

The `architecture` section in the configuration has its own `exclude` option, which can be used to exclude certain files and directories from the Architecture Quality analysis.

    architecture:
      enabled: true
      exclude:
        - ".*/index[.]ts"
        
The list of exclude patterns works in the same way as the global, top-level `exclude` option. The difference is the global option excludes files and directories from *all* Sigrid capabilities, and the architecture `exclude` option excludes them from Architecture Quality but not from other Sigrid capabilities. See the [pattern documentation](#defining-include-and-exclude-patterns) for more information on writing these patterns.

## Configuring multi-repo systems

Sigrid allows you to create ["multi-repo systems"](../sigridci-integration/development-workflows.md#combining-multiple-repositories-into-a-single-Sigrid-system) that are the combination of multiple repositories in your development environment. In this situation, each individual repository within the system is referred to as a "subsystem". Such a view is more high-level than looking at individual repositories, and is sometimes a better fit if you want to align on Sigrid findings with stakeholders from outside the development organization.

Since multi-repo systems are used to create a *shared* view, they also require shared [objectives](../capabilities/objectives.md) and a shared configuration. The latter creates an obvious problem: if the configuration file is normally located in the root of the repository, how does that work when there are multiple repositories?

In such a situation, you can use [Sigrid CI](client-script-usage.md) to manage the shared configuration:

- Publishing with `--system mybank --subsystem mybank-backend` will publish the code for the subsystem "mybank-backend" within the system "mybank".
- Publishing with `--system mybank --subsystem mybank-frontend` will publish the code for the subsystem "mybank-frontend" within the system "mybank".
- Publishing with `--system mybank --subsystem root` allows you to publish code to the root of the system "mybank", i.e. files that are not bound to a specific system. This includes the configuration file `sigrid.yaml`, so this can be used to update `sigrid.yaml` programmatically.
          
## Sigrid metadata

`sigrid.yaml` is used for *analysis* configuration. It is also possible to configure Sigrid *metadata*. See the [Sigrid metadata](../organization-integration/metadata.md) section for the various ways you can update this metadata.

## Contact and support

Feel free to contact [SIG's support department](mailto:support@softwareimprovementgroup.com) for any questions or issues you may have after reading this document, or when using Sigrid or Sigrid CI. Users in Europe can also contact us by phone at +31 20 314 0953.
